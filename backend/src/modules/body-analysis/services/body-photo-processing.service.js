import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  buildUserPngStoragePath,
} from '../../../storage/utils/storage-path.util';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { StorageService } from '../../../storage/services/storage.service';
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
    @Inject(StorageService) storageService,
    @Inject(AiService) aiService,
    @Inject(BodyAnalysisRepository) bodyAnalysisRepository,
  ) {
    this.configService = configService;
    this.storagePathResolver = storagePathResolver;
    this.storageService = storageService;
    this.aiService = aiService;
    this.bodyAnalysisRepository = bodyAnalysisRepository;
    this.logger = new Logger(BodyPhotoProcessingService.name);
    this.pythonScript = join(process.cwd(), 'python', 'remove_background.py');
  }

  getTransparentPngPath(userId) {
    return buildUserPngStoragePath(userId);
  }

  async transparentPngExists(userId) {
    return this.storageService.storedFileExists(this.getTransparentPngPath(userId));
  }

  getTransparentPngAbsolutePath(userId) {
    const rootDir = this.configService.get('storage.local.rootDir') || 'uploads';
    return join(rootDir, 'user-png', `${userId}.png`);
  }

  async removeTransparentPng(userId) {
    await this.storageService.deleteStoredFile(this.getTransparentPngPath(userId));
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
      && await this.transparentPngExists(userId),
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
        await this.removeTransparentPng(userId);

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
      && await this.transparentPngExists(userId)
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

  async uploadProcessedPng(userId, buffer) {
    const uploadResult = await this.storageService.uploadUserPng(userId, buffer);

    return {
      storagePath: uploadResult.storagePath,
      publicUrl: this.storageService.resolvePublicUrl(uploadResult.storagePath),
      cached: false,
    };
  }

  async processTryOnPersonUpload(userId, originalImagePath) {
    return {
      storagePath: originalImagePath,
      publicUrl: this.storagePathResolver.toPublicUrl(originalImagePath),
      usedFallback: false,
      skippedBackgroundRemoval: true,
    };
  }

  async runLocalPythonRemoval(userId, bodyImagePath, outputPath) {
    const storedImage = await this.storageService.readStoredFile(bodyImagePath);

    if (!storedImage?.buffer?.length) {
      throw new Error('Stored body image could not be loaded for background removal');
    }

    const tempDir = await mkdtemp(join(tmpdir(), 'wardrobe-body-'));
    const inputAbsolute = join(tempDir, 'input.jpg');
    const outputAbsolute = join(tempDir, 'output.png');

    try {
      await writeFile(inputAbsolute, storedImage.buffer);

      if (!existsSync(this.pythonScript)) {
        throw new Error('Python background removal script not found');
      }

      await new Promise((resolve, reject) => {
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

          resolve();
        });
      });

      const outputBuffer = await readFile(outputAbsolute);
      return this.uploadProcessedPng(userId, outputBuffer);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}
