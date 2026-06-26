import {
  BadGatewayException,
  BadRequestException,
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
import {
  assertTryOnImageUrl,
  isRetryableTryOnError,
  mapTryOnServiceError,
} from './utils/try-on-image.util';

const TRYON_PATH = '/tryon/generate';
const TRYON_TIMEOUT_MS = 65000;
const TRYON_RETRY_DELAYS_MS = [2000, 4000, 8000];
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

  get aiServicePublicUrl() {
    return String(
      this.configService.get('aiService.publicUrl')
      || process.env.AI_SERVICE_PUBLIC_URL
      || this.baseUrl
      || 'http://localhost:8000',
    ).replace(/\/$/, '');
  }

  resolvePublicImageUrl(url, resolver) {
    if (!url) {
      return null;
    }

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    return resolver(url) || url;
  }

  async postTryOnWithRetry(url, payload) {
    let lastError;

    for (let attempt = 0; attempt < TRYON_RETRY_DELAYS_MS.length + 1; attempt += 1) {
      try {
        return await firstValueFrom(
          this.httpService.post(url, payload, {
            timeout: TRYON_TIMEOUT_MS,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      } catch (error) {
        lastError = error;

        if (!isRetryableTryOnError(error) || attempt >= TRYON_RETRY_DELAYS_MS.length) {
          throw error;
        }

        const delayMs = TRYON_RETRY_DELAYS_MS[attempt];
        this.logger.warn(
          `HuggingFace model loading (attempt ${attempt + 1}/${TRYON_RETRY_DELAYS_MS.length + 1}), retrying in ${delayMs}ms`,
        );
        await new Promise((resolve) => {
          setTimeout(resolve, delayMs);
        });
      }
    }

    throw lastError;
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

    if (url.startsWith('/')) {
      return `${internalBase}${url}`;
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

    const aiPublicBase = this.aiServicePublicUrl;

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

    const validatedPersonUrl = assertTryOnImageUrl(personImageUrl, 'Person');
    const validatedGarmentUrl = assertTryOnImageUrl(garmentImageUrl, 'Garment');

    const url = `${this.baseUrl}${TRYON_PATH}`;
    const aiPersonUrl = this.rewriteImageUrlForAi(validatedPersonUrl);
    const aiGarmentUrl = this.rewriteImageUrlForAi(validatedGarmentUrl);

    this.logger.log('Uploading person image for virtual try-on');
    this.logger.log('Uploading garment image for virtual try-on');
    this.logger.log(`Calling HuggingFace try-on | url=${url}`);

    const startedAt = Date.now();

    try {
      const response = await this.postTryOnWithRetry(url, {
        personImageUrl: aiPersonUrl,
        garmentImageUrl: aiGarmentUrl,
      });

      const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
      this.logger.log(`Inference completed in ${elapsedSec} sec | status=${response.status}`);

      const result = this.normalizeTryOnResultUrl(response.data);

      if (persistHistory) {
        await this.tryOnHistoryRepository.create(userId, {
          inputImage: validatedPersonUrl,
          transparentImage: validatedGarmentUrl,
          generatedImage: result?.resultImageUrl || result?.result_image_url || null,
          selectedProducts: [],
        });
      }

      this.logger.log('Virtual try-on generation successful.');
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
    const message = mapTryOnServiceError(error);

    this.logger.error(
      `Virtual try-on failed | status=${status || 'n/a'} | ${error?.response?.data?.detail || error?.message || message}`,
    );

    if (error?.code === 'ECONNABORTED' || status === 504) {
      throw new GatewayTimeoutException(message);
    }

    if (status === 400) {
      throw new BadRequestException(message);
    }

    if (status) {
      throw new BadGatewayException(message);
    }

    throw new ServiceUnavailableException(message);
  }}
