import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import {
  buildTryOnPersonProcessedStoragePath,
  buildUserPngStoragePath,
} from '../../../storage/utils/storage-path.util';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { AiService } from '../../ai/services/ai.service';
import { BodyAnalysisRepository } from '../body-analysis.repository';

const PROCESSING_STATUS = {
  COMPLETED: 'completed',
  FAILED: 'failed',
  FALLBACK: 'fallback',
  CACHED: 'cached',
};

export @Injectable()
class BodyPhotoProcessingService {
  constructor(
    @Inject(ConfigService) configService,
    @Inject(StoragePathResolver) storagePathResolver,
    @Inject(AiService) aiService,
    @Inject(BodyAnalysisRepository) bodyAnalysisRepository,
  ) {
    this.configService = configService;
    this.storagePathResolver = storagePathResolver;
    this.aiService = aiService;
    this.bodyAnalysisRepository = bodyAnalysisRepository;
    this.logger = new Logger(BodyPhotoProcessingService.name);
    this.pythonScript = join(process.cwd(), 'python', 'remove_background.py');
  }

  getTransparentPngPath(userId) {
    return buildUserPngStoragePath(userId);
  }

  transparentPngExists(userId) {
    const absolutePath = this.getTransparentPngAbsolutePath(userId);
    return existsSync(absolutePath);
  }

  getTransparentPngAbsolutePath(userId) {
    const rootDir = this.configService.get('storage.local.rootDir') || 'uploads';
    return join(rootDir, 'user-png', `${userId}.png`);
  }

  removeTransparentPng(userId) {
    const absolutePath = this.getTransparentPngAbsolutePath(userId);

    if (existsSync(absolutePath)) {
      unlinkSync(absolutePath);
    }
  }

  readProcessingMetadata(preferences = {}) {
    return preferences.bodyPhotoProcessing || null;
  }

  async processAfterUpload(userId, originalImagePath) {
    if (!originalImagePath) {
      return null;
    }

    const user = await this.bodyAnalysisRepository.findUserBodyImageContext(userId);
    const preferences = user?.profile?.preferences || {};
    const existingMeta = this.readProcessingMetadata(preferences);
    const outputPath = this.getTransparentPngPath(userId);
    const processedAt = new Date().toISOString();
    let result = null;
    let processingStatus = PROCESSING_STATUS.FAILED;

    const canReuseCache = Boolean(
      existingMeta?.processedTransparentImage
      && existingMeta?.originalImage === originalImagePath
      && this.transparentPngExists(userId),
    );

    try {
      if (canReuseCache) {
        result = {
          storagePath: existingMeta.processedTransparentImage,
          publicUrl: this.storagePathResolver.toPublicUrl(existingMeta.processedTransparentImage),
          cached: true,
        };
        processingStatus = PROCESSING_STATUS.CACHED;
      } else {
        this.removeTransparentPng(userId);

        result = await this.removeBackgroundToPath(userId, originalImagePath, outputPath);
        processingStatus = result?.storagePath
          ? PROCESSING_STATUS.COMPLETED
          : PROCESSING_STATUS.FAILED;
      }
    } catch (error) {
      this.logger.warn(
        `Body photo background removal failed for user ${userId}: ${error.message}`,
      );
      processingStatus = PROCESSING_STATUS.FALLBACK;
    }

    const metadata = {
      originalImage: originalImagePath,
      processedTransparentImage: result?.storagePath || null,
      processedAt,
      processingStatus,
    };

    await this.persistProcessingMetadata(userId, metadata);

    return {
      ...metadata,
      publicUrl: result?.storagePath
        ? this.storagePathResolver.toPublicUrl(result.storagePath)
        : this.storagePathResolver.toPublicUrl(originalImagePath),
      usedFallback: processingStatus === PROCESSING_STATUS.FALLBACK
        || processingStatus === PROCESSING_STATUS.FAILED,
    };
  }

  async ensureTransparentPng(userId, bodyImagePath) {
    const existing = this.readProcessingMetadata(
      (await this.bodyAnalysisRepository.findUserBodyImageContext(userId))
        ?.profile?.preferences || {},
    );

    if (
      existing?.processedTransparentImage
      && existing?.originalImage === bodyImagePath
      && this.transparentPngExists(userId)
    ) {
      return {
        storagePath: existing.processedTransparentImage,
        publicUrl: this.storagePathResolver.toPublicUrl(existing.processedTransparentImage),
        cached: true,
      };
    }

    return this.processAfterUpload(userId, bodyImagePath);
  }

  async persistProcessingMetadata(userId, metadata) {
    const user = await this.bodyAnalysisRepository.findUserBodyImageContext(userId);

    if (!user?.profile) {
      return;
    }

    const preferences = {
      ...(user.profile.preferences || {}),
      bodyPhotoProcessing: metadata,
      bodyPhotoOriginal: metadata.originalImage,
      bodyPhotoProcessed: metadata.processedTransparentImage || undefined,
      transparentBodyPhoto: metadata.processedTransparentImage || undefined,
    };

    await this.bodyAnalysisRepository.updateProfileBodyImageRefs(userId, {
      preferences,
    });
  }

  async removeBackgroundToPath(userId, inputPath, outputPath) {
    if (this.aiService.isConfigured()) {
      try {
        const result = await this.aiService.removeBodyBackground({
          userId,
          bodyImagePath: inputPath,
          outputPath,
        });

        if (result?.storagePath) {
          return {
            storagePath: result.storagePath,
            publicUrl: this.storagePathResolver.toPublicUrl(result.storagePath),
            cached: Boolean(result.cached),
          };
        }
      } catch (aiError) {
        this.logger.warn(
          `AI background removal failed for user ${userId}: ${aiError.message}`,
        );
      }
    }

    return this.runLocalPythonRemoval(userId, inputPath, outputPath);
  }

  async processTryOnPersonUpload(userId, originalImagePath) {
    const outputPath = buildTryOnPersonProcessedStoragePath(userId);

    try {
      return await this.removeBackgroundToPath(userId, originalImagePath, outputPath);
    } catch (error) {
      this.logger.warn(
        `Try-on person background removal failed for user ${userId}: ${error.message}`,
      );

      return {
        storagePath: originalImagePath,
        publicUrl: this.storagePathResolver.toPublicUrl(originalImagePath),
        usedFallback: true,
      };
    }
  }

  runLocalPythonRemoval(userId, bodyImagePath, outputPath) {
    return new Promise((resolve, reject) => {
      const rootDir = this.configService.get('storage.local.rootDir') || 'uploads';
      const normalized = bodyImagePath.replace(/^\/uploads\//, '');
      const inputAbsolute = join(rootDir, normalized);
      const outputNormalized = outputPath.replace(/^\/uploads\//, '');
      const outputAbsolute = join(rootDir, outputNormalized);

      if (!existsSync(this.pythonScript)) {
        reject(new Error('Python background removal script not found'));
        return;
      }

      const pythonBin = process.env.PYTHON_BIN || 'python';
      const child = spawn(pythonBin, [
        this.pythonScript,
        '--input',
        inputAbsolute,
        '--output',
        outputAbsolute,
      ], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stderr = '';

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', (error) => {
        reject(error);
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr || `Background removal exited with code ${code}`));
          return;
        }

        resolve({
          storagePath: outputPath,
          publicUrl: this.storagePathResolver.toPublicUrl(outputPath),
          cached: false,
        });
      });
    });
  }
}
