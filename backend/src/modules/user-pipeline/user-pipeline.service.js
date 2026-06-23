import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { PIPELINE_EVENTS } from './constants/pipeline-events.constants';
import { PIPELINE_SIGNALS, PipelineEventBus } from './pipeline-event.bus';

export @Injectable()
class UserPipelineService {
  constructor(
    @Inject(PipelineEventBus) pipelineEventBus,
    @Inject(ModuleRef) moduleRef,
    @Inject(PrismaService) prisma,
  ) {
    this.pipelineEventBus = pipelineEventBus;
    this.moduleRef = moduleRef;
    this.prisma = prisma;
    this.logger = new Logger(UserPipelineService.name);
  }

  onModuleInit() {
    this.pipelineEventBus.on(
      PIPELINE_SIGNALS.FACE_ANALYSIS_COMPLETED,
      ({ userId }) => this.onFaceAnalysisCompleted(userId),
    );
    this.pipelineEventBus.on(
      PIPELINE_SIGNALS.BODY_ANALYSIS_COMPLETED,
      ({ userId }) => this.onBodyAnalysisCompleted(userId),
    );
    this.pipelineEventBus.on(
      PIPELINE_SIGNALS.PROFILE_UPDATED,
      ({ userId }) => this.onProfileUpdated(userId),
    );
  }

  getFaceAnalysisService() {
    const { FaceAnalysisService } = require('../face-analysis/face-analysis.service');
    return this.moduleRef.get(FaceAnalysisService, { strict: false });
  }

  getDigitalAvatarService() {
    const { DigitalAvatarService } = require('../digital-avatar/digital-avatar.service');
    return this.moduleRef.get(DigitalAvatarService, { strict: false });
  }

  getFashionDnaService() {
    const { FashionDnaService } = require('../fashion-dna/services/fashion-dna.service');
    return this.moduleRef.get(FashionDnaService, { strict: false });
  }

  logEvent(event, userId, details = '') {
    const suffix = details ? ` | ${details}` : '';
    this.logger.log(`${event} | userId=${userId}${suffix}`);
  }

  onUserCreated(userId) {
    this.logEvent(PIPELINE_EVENTS.USER_CREATED, userId);
  }

  onFaceRegistered(userId, imageDto) {
    this.logEvent(PIPELINE_EVENTS.FACE_REGISTERED, userId);

    setImmediate(() => {
      this.runFaceAnalysis(userId, imageDto).catch((error) => {
        this.logger.warn(
          `Face analysis auto-trigger failed for user ${userId}: ${error.message}`,
        );
      });
    });
  }

  async runFaceAnalysis(userId, imageDto) {
    if (!imageDto?.imageBuffer?.length) {
      return null;
    }

    const faceAnalysisService = this.getFaceAnalysisService();
    await faceAnalysisService.analyzeFace(userId, imageDto);

    return true;
  }

  async onFaceAnalysisCompleted(userId) {
    this.logEvent(PIPELINE_EVENTS.FACE_ANALYSIS_COMPLETED, userId);
    await this.tryGenerateAvatar(userId);
    await this.tryGenerateFashionDna(userId);
  }

  async onBodyAnalysisCompleted(userId) {
    this.logEvent(PIPELINE_EVENTS.BODY_ANALYSIS_COMPLETED, userId);
    await this.tryGenerateAvatar(userId);
    await this.tryGenerateFashionDna(userId);
  }

  async onProfileUpdated(userId) {
    await this.tryGenerateFashionDna(userId);
  }

  async shouldGenerateAvatar(userId) {
    const [face, body, activeAvatar] = await Promise.all([
      this.prisma.faceAnalysis.findUnique({ where: { user_id: userId } }),
      this.prisma.bodyAnalysis.findUnique({ where: { user_id: userId } }),
      this.prisma.digitalAvatar.findFirst({
        where: { user_id: userId, is_active: true },
        orderBy: { version: 'desc' },
      }),
    ]);

    if (!face || !body) {
      return false;
    }

    if (!activeAvatar) {
      return true;
    }

    const faceUpdatedAt = new Date(face.updated_at).getTime();
    const bodyUpdatedAt = new Date(body.updated_at).getTime();
    const avatarUpdatedAt = new Date(activeAvatar.updated_at).getTime();

    return faceUpdatedAt > avatarUpdatedAt || bodyUpdatedAt > avatarUpdatedAt;
  }

  async tryGenerateAvatar(userId) {
    try {
      const shouldGenerate = await this.shouldGenerateAvatar(userId);

      if (!shouldGenerate) {
        return null;
      }

      const digitalAvatarService = this.getDigitalAvatarService();
      await digitalAvatarService.generateBasicAvatar(userId);
      this.logEvent(PIPELINE_EVENTS.AVATAR_GENERATED, userId);

      return true;
    } catch (error) {
      this.logger.warn(
        `Avatar auto-generation failed for user ${userId}: ${error.message}`,
      );
      return null;
    }
  }

  async tryGenerateFashionDna(userId) {
    try {
      const fashionDnaService = this.getFashionDnaService();
      const result = await fashionDnaService.generateFashionDnaIfReady(userId);

      if (result) {
        this.logEvent(PIPELINE_EVENTS.FASHION_DNA_GENERATED, userId);
      }

      return result;
    } catch (error) {
      this.logger.warn(
        `Fashion DNA auto-generation failed for user ${userId}: ${error.message}`,
      );
      return null;
    }
  }
}
