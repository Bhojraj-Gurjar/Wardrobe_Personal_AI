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
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { StorageService } from '../../storage/services/storage.service';
import { TryOnHistoryRepository } from './try-on-history.repository';
import {
  assertTryOnImageUrl,
  isRetryableTryOnError,
  mapTryOnServiceError,
} from './utils/try-on-image.util';

const TRYON_PATH = '/tryon/generate';
const TRYON_TIMEOUT_MS = 120000;
const TRYON_RETRY_DELAYS_MS = [2000, 4000, 8000];
export @Injectable()
class TryOnService {
  constructor(
    @Inject(HttpService) httpService,
    @Inject(ConfigService) configService,
    @Inject(TryOnHistoryRepository) tryOnHistoryRepository,
    @Inject(StorageService) storageService,
  ) {
    this.httpService = httpService;
    this.configService = configService;
    this.tryOnHistoryRepository = tryOnHistoryRepository;
    this.storageService = storageService;
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
      || 'http://localhost:8000',
    ).replace(/\/$/, '');
  }

  toBrowserAccessibleTryOnUrl(url) {
    if (!url) {
      return null;
    }

    const raw = String(url).trim();

    if (!raw) {
      return null;
    }

    const publicBase = this.aiServicePublicUrl;
    const internalBase = this.baseUrl;

    if (/^https?:\/\//i.test(raw)) {
      if (internalBase && publicBase && raw.startsWith(internalBase)) {
        return `${publicBase}${raw.slice(internalBase.length)}`;
      }

      const rewritten = raw.replace(
        /^https?:\/\/ai-service:8000/i,
        publicBase,
      );

      return rewritten;
    }

    const path = raw.startsWith('/') ? raw : `/${raw}`;

    if (path.startsWith('/tryon/')) {
      return `${publicBase}${path}`;
    }

    const storageBase = this.storagePublicBaseUrl || 'http://localhost:3000';
    return `${storageBase}${path}`;
  }

  isDurableTryOnStoragePath(value) {
    return typeof value === 'string'
      && value.includes('/uploads/try-on/')
      && value.includes('/results/');
  }

  resolveDownloadUrl(url) {
    if (!url) {
      return null;
    }

    const raw = String(url).trim();

    if (/^https?:\/\//i.test(raw)) {
      if (raw.includes('/tryon/results/')) {
        const publicBase = this.aiServicePublicUrl;
        const internalBase = this.baseUrl;

        if (internalBase && publicBase && raw.startsWith(publicBase)) {
          return `${internalBase}${raw.slice(publicBase.length)}`;
        }

        return raw.replace(/^https?:\/\/localhost:8000/i, internalBase || publicBase);
      }

      return raw;
    }

    const path = raw.startsWith('/') ? raw : `/${raw}`;

    if (path.startsWith('/tryon/')) {
      return `${this.baseUrl}${path}`;
    }

    if (path.startsWith('/uploads/')) {
      return `${this.storageInternalBaseUrl || this.storagePublicBaseUrl}${path}`;
    }

    return raw;
  }

  async downloadImageBuffer(url) {
    const downloadUrl = this.resolveDownloadUrl(url);

    if (!downloadUrl) {
      return null;
    }

    try {
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        this.logger.warn(`Try-on image download failed | status=${response.status} | url=${downloadUrl}`);
        return null;
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      this.logger.warn(`Try-on image download error | url=${downloadUrl} | ${error?.message || error}`);
      return null;
    }
  }

  async persistGeneratedResult(userId, sourceUrl) {
    if (!sourceUrl || this.isDurableTryOnStoragePath(sourceUrl)) {
      return sourceUrl;
    }

    const buffer = await this.downloadImageBuffer(sourceUrl);

    if (!buffer?.length) {
      return sourceUrl;
    }

    const resultId = randomUUID();
    const uploadResult = await this.storageService.uploadTryOnResultImage({
      userId,
      resultId,
      buffer,
      mimeType: 'image/png',
    });

    this.logger.log(
      `Persisted try-on result for user ${userId} at ${uploadResult.storagePath}`,
    );

    return uploadResult.storagePath;
  }

  toPublicTryOnUrl(value, resolver) {
    if (!value) {
      return null;
    }

    if (this.isDurableTryOnStoragePath(value)) {
      return resolver(value) || value;
    }

    return this.toBrowserAccessibleTryOnUrl(value);
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

    const resolved = this.toBrowserAccessibleTryOnUrl(raw);

    return {
      ...result,
      resultImageUrl: resolved,
      result_image_url: resolved,
    };
  }

  async generateTryOn(userId, personImageUrl, garmentImageUrl, options = {}) {
    const {
      persistHistory = true,
      garmentRegion = 'upper',
      garments = null,
    } = options;

    if (!this.baseUrl) {
      throw new ServiceUnavailableException('AI_SERVICE_URL is not configured');
    }

    const validatedPersonUrl = assertTryOnImageUrl(personImageUrl, 'Person');

    const url = `${this.baseUrl}${TRYON_PATH}`;
    const aiPersonUrl = this.rewriteImageUrlForAi(validatedPersonUrl);

    const payload = {
      personImageUrl: aiPersonUrl,
    };

    if (Array.isArray(garments) && garments.length) {
      payload.garments = garments.map((layer) => ({
        garmentImageUrl: this.rewriteImageUrlForAi(
          assertTryOnImageUrl(layer.garmentImageUrl, 'Garment'),
        ),
        garmentRegion: layer.garmentRegion || 'upper',
      }));
    } else {
      const validatedGarmentUrl = assertTryOnImageUrl(garmentImageUrl, 'Garment');
      payload.garmentImageUrl = this.rewriteImageUrlForAi(validatedGarmentUrl);
      payload.garmentRegion = garmentRegion || 'upper';
    }

    this.logger.log('Uploading person image for virtual try-on');
    this.logger.log('Uploading garment image for virtual try-on');
    this.logger.log(`Calling HuggingFace try-on | url=${url}`);

    const startedAt = Date.now();

    try {
      const response = await this.postTryOnWithRetry(url, payload);

      const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
      this.logger.log(`Inference completed in ${elapsedSec} sec | status=${response.status}`);

      const result = this.normalizeTryOnResultUrl(response.data);
      const rawResultUrl = result?.resultImageUrl || result?.result_image_url || null;
      const persistedPath = persistHistory
        ? await this.persistGeneratedResult(userId, rawResultUrl)
        : rawResultUrl;
      const resolvedResultUrl = this.toPublicTryOnUrl(
        persistedPath,
        (path) => this.resolvePublicImageUrl(path, (value) => value),
      ) || rawResultUrl;
      const normalizedResult = {
        ...result,
        resultImageUrl: resolvedResultUrl,
        result_image_url: resolvedResultUrl,
        tryOnMode: result?.tryOnMode || result?.try_on_mode || null,
        garmentsApplied: result?.garmentsApplied ?? result?.garments_applied ?? null,
      };

      if (persistHistory) {
        await this.tryOnHistoryRepository.create(userId, {
          inputImage: validatedPersonUrl,
          transparentImage: Array.isArray(garments) && garments[0]
            ? garments[0].garmentImageUrl
            : garmentImageUrl,
          generatedImage: persistedPath || rawResultUrl,
          selectedProducts: [],
        });
      }

      this.logger.log('Virtual try-on generation successful.');
      return normalizedResult;
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
    const detail = error?.response?.data?.detail || error?.message || message;

    this.logger.error(
      `Virtual try-on failed | status=${status || 'n/a'} | ${detail}`,
    );

    if (process.env.NODE_ENV === 'development') {
      this.logger.error(
        `Virtual try-on failure detail | code=${error?.code || 'n/a'} | response=${JSON.stringify(error?.response?.data || null)}`,
      );

      if (error?.stack) {
        this.logger.error(error.stack);
      }
    }

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
