import {
  Inject,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  forwardRef,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { FaceAnalysisRepository } from './face-analysis.repository';
import { FaceBiometricTraitsService } from './services/face-biometric-traits.service';
import { FaceAnalysisVectorService } from './services/face-analysis-vector.service';
import { FaceImageStorageService } from '../face/services/face-image-storage.service';
import { AiService } from '../ai/services/ai.service';
import { REFRESH_SOURCES } from '../fashion-dna/constants/fashion-dna-regeneration.constants';
import { FashionDnaRegenerationService } from '../fashion-dna/services/fashion-dna-regeneration.service';
import { PIPELINE_SIGNALS, PipelineEventBus } from '../user-pipeline/pipeline-event.bus';
import { NotificationsService } from '../notifications/notifications.service';
import { APP_NOTIFICATION_TYPES } from '../notifications/notifications.constants';

function resolveUserArtifacts(moduleRef) {
  const { UserArtifactsService } = require('../user-artifacts/user-artifacts.service');
  return moduleRef.get(UserArtifactsService, { strict: false });
}

function resolveFaceService(moduleRef) {
  const { FaceService } = require('../face/services/face.service');
  return moduleRef.get(FaceService, { strict: false });
}
import {
  formatFaceAnalysisRecord,
  mapRecordToStoredTraits,
  mapUpdateDtoToPersistence,
} from './utils/face-analysis.mapper';

export @Injectable()
class FaceAnalysisService {
  constructor(
    @Inject(FaceAnalysisRepository) faceAnalysisRepository,
    @Inject(FaceBiometricTraitsService) biometricTraitsService,
    @Inject(FaceAnalysisVectorService) faceAnalysisVectorService,
    @Inject(FaceImageStorageService) faceImageStorageService,
    @Inject(AiService) aiService,
    @Inject(forwardRef(() => FashionDnaRegenerationService))
    fashionDnaRegenerationService,
    @Inject(PipelineEventBus) pipelineEventBus,
    @Inject(ModuleRef) moduleRef,
    @Inject(NotificationsService) notificationsService,
  ) {
    this.faceAnalysisRepository = faceAnalysisRepository;
    this.biometricTraitsService = biometricTraitsService;
    this.faceAnalysisVectorService = faceAnalysisVectorService;
    this.faceImageStorageService = faceImageStorageService;
    this.aiService = aiService;
    this.fashionDnaRegenerationService = fashionDnaRegenerationService;
    this.pipelineEventBus = pipelineEventBus;
    this.moduleRef = moduleRef;
    this.notificationsService = notificationsService;
    this.logger = new Logger(FaceAnalysisService.name);
  }

  async collectBiometricTraits(userId) {
    return this.biometricTraitsService.collectBiometricTraits(userId);
  }

  async getStoredTraits(userId) {
    const record = await this.faceAnalysisRepository.findByUserId(userId);

    if (!record) {
      return null;
    }

    return mapRecordToStoredTraits(record);
  }

  async getMyFaceAnalysis(userId) {
    const record = await resolveUserArtifacts(this.moduleRef).ensureFaceAnalysis(userId);
    const facePhoto = await resolveFaceService(this.moduleRef).getFacePhoto(userId);

    return {
      ...record,
      face_image_url: facePhoto.face_image_url,
      faceImageUrl: facePhoto.faceImageUrl,
      is_face_registered: facePhoto.is_face_registered,
      facePhotoMissing: Boolean(facePhoto.facePhotoMissing),
    };
  }

  async analyzeFace(userId, imageDto, options = {}) {
    if (!imageDto?.imageBuffer?.length) {
      throw new BadRequestException('Provide a frontFace image upload.');
    }

    if (!this.aiService.isConfigured()) {
      throw new ServiceUnavailableException('AI service unavailable.');
    }

    await resolveFaceService(this.moduleRef).replaceFacePhoto(userId, imageDto);

    return this.persistFaceTraitAnalysis(userId, imageDto, options);
  }

  async analyzeStoredFace(userId) {
    const facePhoto = await resolveFaceService(this.moduleRef).getFacePhoto(userId);

    if (!facePhoto.is_face_registered || !facePhoto.face_image_url) {
      throw new BadRequestException('Register a face photo before running analysis.');
    }

    if (!this.aiService.isConfigured()) {
      throw new ServiceUnavailableException('AI service unavailable.');
    }

    const storedImage = await this.faceImageStorageService.readFaceImage(
      facePhoto.face_image_url,
    );

    if (!storedImage?.buffer?.length) {
      throw new BadRequestException(
        'Your saved face photo is no longer available. Upload a new photo to run analysis.',
      );
    }

    return this.persistFaceTraitAnalysis(userId, {
      imageBuffer: storedImage.buffer,
      imageMimeType: storedImage.mimeType,
    }, { captureSource: 'stored' });
  }

  async persistFaceTraitAnalysis(userId, imageDto, options = {}) {
    let aiResponse;

    try {
      aiResponse = await this.aiService.analyzeFaceTraits(
        imageDto.imageBuffer,
        imageDto.imageMimeType,
      );
    } catch (error) {
      this.logger.error(
        `Face trait analysis failed for user ${userId}: ${error.message}`,
      );
      throw error;
    }

    const enrichedResponse = {
      ...(aiResponse && typeof aiResponse === 'object' ? aiResponse : {}),
      captureSource: options.captureSource || imageDto.captureSource || 'camera',
      analyzedAt: new Date().toISOString(),
    };

    const record = await this.faceAnalysisRepository.saveAnalysisFromAi(
      userId,
      enrichedResponse,
    );

    await this.faceAnalysisVectorService.syncUserVector(userId, record);

    this.fashionDnaRegenerationService.trigger(
      userId,
      REFRESH_SOURCES.FACE_ANALYSIS,
    );

    setImmediate(() => {
      this.pipelineEventBus.emit(PIPELINE_SIGNALS.FACE_ANALYSIS_COMPLETED, {
        userId,
      });
    });

    this.notificationsService.notifyProfileEvent(
      userId,
      APP_NOTIFICATION_TYPES.FACE_UPDATED,
      'Face analysis completed',
      'Your face analysis report is ready to view.',
      '/face-analysis',
    ).catch(() => null);

    const facePhoto = await resolveFaceService(this.moduleRef).getFacePhoto(userId);

    return {
      ...formatFaceAnalysisRecord(record),
      face_image_url: facePhoto.face_image_url,
      faceImageUrl: facePhoto.faceImageUrl,
      is_face_registered: facePhoto.is_face_registered,
    };
  }

  async updateFaceAnalysis(userId, dto) {
    const existing = await this.faceAnalysisRepository.findByUserId(userId);

    if (!existing) {
      throw new NotFoundException(
        'Face analysis not found. Run POST /face-analysis/analyze first.',
      );
    }

    const extracted = mapUpdateDtoToPersistence(dto);

    if (!Object.keys(extracted).length) {
      throw new BadRequestException('Provide at least one field to update');
    }

    const record = await this.faceAnalysisRepository.updateExtractedTraits(
      userId,
      dto,
      existing,
    );

    await this.faceAnalysisVectorService.syncUserVector(userId, record);

    this.fashionDnaRegenerationService.trigger(
      userId,
      REFRESH_SOURCES.FACE_ANALYSIS,
    );

    return formatFaceAnalysisRecord(record);
  }
}
