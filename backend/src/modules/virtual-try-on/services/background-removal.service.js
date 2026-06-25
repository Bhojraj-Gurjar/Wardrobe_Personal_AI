import { existsSync } from 'fs';
import { join } from 'path';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import { USER_PNG_PUBLIC_PREFIX } from '../../../storage/storage.constants';
import { StorageService } from '../../../storage/services/storage.service';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { AiService } from '../../ai/services/ai.service';

export @Injectable()
class BackgroundRemovalService {
  constructor(
    @Inject(ConfigService) configService,
    @Inject(StorageService) storageService,
    @Inject(StoragePathResolver) storagePathResolver,
    @Inject(AiService) aiService,
  ) {
    this.configService = configService;
    this.storageService = storageService;
    this.storagePathResolver = storagePathResolver;
    this.aiService = aiService;
    this.logger = new Logger(BackgroundRemovalService.name);
    this.pythonScript = join(process.cwd(), 'python', 'remove_background.py');
  }

  getTransparentPngPath(userId) {
    return `${USER_PNG_PUBLIC_PREFIX}/${userId}.png`;
  }

  transparentPngExists(userId) {
    const storagePath = this.getTransparentPngPath(userId);
    const rootDir = this.configService.get('storage.local.rootDir') || 'uploads';
    const absolutePath = join(rootDir, 'user-png', `${userId}.png`);
    return existsSync(absolutePath);
  }

  async ensureTransparentPng(userId, bodyImagePath) {
    const outputPath = this.getTransparentPngPath(userId);

    if (this.transparentPngExists(userId)) {
      return {
        storagePath: outputPath,
        publicUrl: this.storagePathResolver.toPublicUrl(outputPath),
        cached: true,
      };
    }

    if (!bodyImagePath) {
      return null;
    }

    if (this.aiService.isConfigured()) {
      try {
        const result = await this.aiService.removeBodyBackground({
          userId,
          bodyImagePath,
          outputPath,
        });

        if (result?.storagePath) {
          return {
            storagePath: result.storagePath,
            publicUrl: this.storagePathResolver.toPublicUrl(result.storagePath),
            cached: Boolean(result.cached),
          };
        }
      } catch (error) {
        this.logger.warn(
          `AI background removal failed for user ${userId}: ${error.message}`,
        );
      }
    }

    try {
      return await this.runLocalPythonRemoval(userId, bodyImagePath, outputPath);
    } catch (error) {
      this.logger.warn(
        `Local background removal unavailable for user ${userId}: ${error.message}`,
      );
      return null;
    }
  }

  runLocalPythonRemoval(userId, bodyImagePath, outputPath) {
    return new Promise((resolve, reject) => {
      const rootDir = this.configService.get('storage.local.rootDir') || 'uploads';
      const normalized = bodyImagePath.replace(/^\/uploads\//, '');
      const inputAbsolute = join(rootDir, normalized);
      const outputAbsolute = join(rootDir, 'user-png', `${userId}.png`);

      if (!existsSync(this.pythonScript)) {
        reject(new Error('Python background removal script not found'));
        return;
      }

      const child = spawn('python', [
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
