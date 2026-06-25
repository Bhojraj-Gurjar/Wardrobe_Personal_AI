import {
  BadGatewayException,
  GatewayTimeoutException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TryOnHistoryRepository } from './try-on-history.repository';

const TRYON_PATH = '/tryon/generate';
const TRYON_TIMEOUT_MS = 65000;

export @Injectable()
class TryOnService {
  constructor(
    @Inject(HttpService) httpService,
    @Inject(ConfigService) configService,
    @Inject(TryOnHistoryRepository) tryOnHistoryRepository,
  ) {
    this.httpService = httpService;
    this.configService = configService;
    this.tryOnHistoryRepository = tryOnHistoryRepository;
    this.logger = new Logger(TryOnService.name);
  }

  get baseUrl() {
    const configured =
      this.configService.get('aiService.url')
      || process.env.AI_SERVICE_URL
      || '';

    return String(configured).replace(/\/$/, '');
  }

  get storagePublicBaseUrl() {
    return String(
      this.configService.get('storage.publicBaseUrl')
      || process.env.STORAGE_PUBLIC_BASE_URL
      || '',
    ).replace(/\/$/, '');
  }

  get storageInternalBaseUrl() {
    return String(
      this.configService.get('storage.internalBaseUrl')
      || process.env.STORAGE_INTERNAL_BASE_URL
      || this.storagePublicBaseUrl,
    ).replace(/\/$/, '');
  }

  rewriteImageUrlForAi(url) {
    const publicBase = this.storagePublicBaseUrl;
    const internalBase = this.storageInternalBaseUrl;

    if (!url || !internalBase) {
      return url;
    }

    if (publicBase && url.startsWith(publicBase)) {
      return `${internalBase}${url.slice(publicBase.length)}`;
    }

    return url.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1):3000/i,
      internalBase,
    );
  }

  normalizeTryOnResultUrl(result) {
    const raw =
      result?.resultImageUrl
      || result?.result_image_url
      || '';

    if (!raw) {
      return result;
    }

    if (/^https?:\/\//i.test(raw)) {
      return {
        ...result,
        resultImageUrl: raw,
        result_image_url: raw,
      };
    }

    const path = raw.startsWith('/') ? raw : `/${raw}`;
    const browserBase = this.storagePublicBaseUrl
      || 'http://localhost:8000';

    const aiPublicBase = String(
      process.env.AI_SERVICE_PUBLIC_URL
      || process.env.NEXT_PUBLIC_AI_SERVICE_URL
      || 'http://localhost:8000',
    ).replace(/\/$/, '');

    const resolved = path.startsWith('/tryon/')
      ? `${aiPublicBase}${path}`
      : `${browserBase}${path}`;

    return {
      ...result,
      resultImageUrl: resolved,
      result_image_url: resolved,
    };
  }

  async generateTryOn(userId, personImageUrl, garmentImageUrl, options = {}) {
    const { persistHistory = true } = options;

    if (!this.baseUrl) {
      throw new ServiceUnavailableException('AI_SERVICE_URL is not configured');
    }

    const url = `${this.baseUrl}${TRYON_PATH}`;
    const aiPersonUrl = this.rewriteImageUrlForAi(personImageUrl);
    const aiGarmentUrl = this.rewriteImageUrlForAi(garmentImageUrl);

    this.logger.log(`→ FastAPI POST ${TRYON_PATH} | url=${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            personImageUrl: aiPersonUrl,
            garmentImageUrl: aiGarmentUrl,
          },
          {
            timeout: TRYON_TIMEOUT_MS,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

      this.logger.log(`← FastAPI POST ${TRYON_PATH} | status=${response.status}`);

      const result = this.normalizeTryOnResultUrl(response.data);

      if (persistHistory) {
        await this.tryOnHistoryRepository.create(userId, {
          inputImage: personImageUrl,
          transparentImage: garmentImageUrl,
          generatedImage: result?.resultImageUrl || result?.result_image_url || null,
          selectedProducts: [],
        });
      }

      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getHistory(userId) {
    const records = await this.tryOnHistoryRepository.findManyByUserId(userId);

    return {
      items: records.map((record) => ({
        id: record.id,
        tryOnInputImage: record.input_image,
        tryOnTransparentImage: record.transparent_image,
        tryOnResultImage: record.generated_image,
        inputImageUrl: record.input_image,
        generatedImageUrl: record.generated_image,
        selectedProducts: record.selected_products,
        createdAt: record.created_at,
      })),
    };
  }

  handleError(error) {
    const status = error?.response?.status;
    const detail =
      error?.response?.data?.detail
      || error?.response?.data?.message
      || error?.message;

    if (error?.code === 'ECONNABORTED' || status === 504) {
      throw new GatewayTimeoutException(
        detail || 'Virtual try-on timed out',
      );
    }

    if (status) {
      throw new BadGatewayException(
        detail || `FastAPI returned HTTP ${status}`,
      );
    }

    throw new ServiceUnavailableException(
      `Cannot reach AI service: ${detail || 'connection failed'}`,
    );
  }
}
