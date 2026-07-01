import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  forwardRef,
} from '@nestjs/common';
import {
  IMAGE_MUTATION_SOURCES,
  sanitizeBodyPhotoPath,
} from '../../common/utils/user-image-guard.util';

import { ModuleRef } from '@nestjs/core';

import { BodyAnalysisRepository } from './body-analysis.repository';

import { BodyAnalysisVectorService } from './services/body-analysis-vector.service';

import { BodyImageStorageService } from './services/body-image-storage.service';
import { BodyPhotoProcessingService } from './services/body-photo-processing.service';
import { BodyFitProductsService } from './services/body-fit-products.service';
import {
  resolveOriginalBodyImagePath,
  resolveTransparentBodyImagePath,
} from './utils/body-photo-display.util';

import { StoragePathResolver } from '../../storage/services/storage-path-resolver.service';

import { AiService } from '../ai/services/ai.service';

import { REFRESH_SOURCES } from '../fashion-dna/constants/fashion-dna-regeneration.constants';

import { FashionDnaRegenerationService } from '../fashion-dna/services/fashion-dna-regeneration.service';

import { PIPELINE_SIGNALS, PipelineEventBus } from '../user-pipeline/pipeline-event.bus';
import { UserMediaRegistryService } from '../user-media/services/user-media-registry.service';
import { NotificationsService } from '../notifications/notifications.service';
import { APP_NOTIFICATION_TYPES } from '../notifications/notifications.constants';

import {

  formatBodyAnalysisRecord,

  mapRecordToStoredTraits,

} from './utils/body-analysis.mapper';



function resolveUserArtifacts(moduleRef) {

  const { UserArtifactsService } = require('../user-artifacts/user-artifacts.service');

  return moduleRef.get(UserArtifactsService, { strict: false });

}



export @Injectable()

class BodyAnalysisService {

  constructor(

    @Inject(BodyAnalysisRepository) bodyAnalysisRepository,

    @Inject(BodyAnalysisVectorService) bodyAnalysisVectorService,

    @Inject(BodyImageStorageService) bodyImageStorageService,

    @Inject(BodyPhotoProcessingService) bodyPhotoProcessingService,

    @Inject(BodyFitProductsService) bodyFitProductsService,

    @Inject(StoragePathResolver) storagePathResolver,

    @Inject(AiService) aiService,

    @Inject(forwardRef(() => FashionDnaRegenerationService))

    fashionDnaRegenerationService,

    @Inject(PipelineEventBus) pipelineEventBus,

    @Inject(ModuleRef) moduleRef,

    @Inject(UserMediaRegistryService) userMediaRegistryService,

    @Inject(NotificationsService) notificationsService,

  ) {

    this.bodyAnalysisRepository = bodyAnalysisRepository;

    this.bodyAnalysisVectorService = bodyAnalysisVectorService;

    this.bodyImageStorageService = bodyImageStorageService;

    this.bodyPhotoProcessingService = bodyPhotoProcessingService;

    this.bodyFitProductsService = bodyFitProductsService;

    this.storagePathResolver = storagePathResolver;

    this.aiService = aiService;

    this.fashionDnaRegenerationService = fashionDnaRegenerationService;

    this.pipelineEventBus = pipelineEventBus;

    this.moduleRef = moduleRef;

    this.userMediaRegistryService = userMediaRegistryService;

    this.notificationsService = notificationsService;

    this.logger = new Logger(BodyAnalysisService.name);

  }



  async getStoredTraits(userId) {

    const record = await this.bodyAnalysisRepository.findByUserId(userId);



    if (!record) {

      return null;

    }



    return mapRecordToStoredTraits(record);

  }



  async getMyBodyAnalysis(userId) {

    await resolveUserArtifacts(this.moduleRef).ensureBodyAnalysis(userId);

    let record = await this.bodyAnalysisRepository.findByUserId(userId);
    const user = await this.bodyAnalysisRepository.findUserBodyImageContext(userId);

    const resolvedPath = await this.resolveCanonicalBodyImagePath(userId, record);

    if (resolvedPath && (!record || record.body_image_url !== resolvedPath)) {
      this.logger.log(
        `Linked stored onboarding body photo for user ${userId}`,
      );
      record = await this.bodyAnalysisRepository.saveBodyImagePath(
        userId,
        resolvedPath,
      );
    }

    return this.enrichBodyAnalysisResponse(record, user);

  }

  buildMeasurementsPayload(record) {
    return {
      height: record?.height ?? null,
      shoulderWidth: record?.shoulder_width ?? null,
      chest: record?.chest ?? null,
      waist: record?.waist ?? null,
      hip: record?.hip ?? null,
      armLength: record?.arm_length ?? null,
      legLength: record?.leg_length ?? null,
    };
  }

  async resolveFitProfile(record) {
    const raw = record?.raw_ai_response || {};
    let fitProfile = record?.fit_profile;

    if (fitProfile?.schemaVersion === 2) {
      return fitProfile;
    }

    if (!record?.body_type || !record?.body_shape || !this.aiService.isConfigured()) {
      return fitProfile;
    }

    try {
      const fitResponse = await this.aiService.generateFitProfile({
        bodyType: record.body_type,
        bodyShape: record.body_shape,
        bodyTypeCode: raw.bodyTypeCode ?? null,
        bodyShapeCode: raw.bodyShapeCode ?? null,
        measurements: this.buildMeasurementsPayload(record),
        bodyTypeRatios: raw.bodyTypeRatios ?? null,
        bodyShapeRatios: raw.bodyShapeRatios ?? null,
        widthMeasurementsCm: raw.widthMeasurementsCm ?? null,
      });

      return fitResponse?.fitProfile || fitProfile;
    } catch (error) {
      this.logger.warn(`Fit profile refresh failed: ${error.message}`);
      return fitProfile;
    }
  }

  async enrichBodyAnalysisResponse(record, context = {}) {
    if (!record) {
      return await this.formatBodyAnalysisResponse(record, context);
    }

    const formatted = await this.formatBodyAnalysisResponse(record, context);

    if (!formatted.hasAnalysis) {
      return formatted;
    }

    const fitProfile = await this.bodyFitProductsService.attachProductsToFitGuide(
      record,
      context?.profile || null,
      await this.resolveFitProfile(record),
    );

    return {
      ...formatted,
      fitProfile,
    };
  }

  async resolveExistingBodyImagePath(userId, record = null, context = null) {
    const user = context?.profile
      ? { profile: context.profile }
      : await this.bodyAnalysisRepository.findUserBodyImageContext(userId);
    const preferences = user?.profile?.preferences || {};
    const candidates = [];

    const pushCandidate = (value) => {
      const sanitized = sanitizeBodyPhotoPath(value);

      if (sanitized && !candidates.includes(sanitized)) {
        candidates.push(sanitized);
      }
    };

    pushCandidate(record?.body_image_url);

    const filesystemPath = await this.bodyImageStorageService.findStoredBodyImagePath(userId);
    pushCandidate(filesystemPath);

    pushCandidate(preferences.bodyPhoto);
    pushCandidate(preferences.body_photo);
    pushCandidate(preferences.onboardingBodyPhoto);
    pushCandidate(preferences.bodyPhotoOriginal);

    for (const candidate of candidates) {
      if (await this.bodyImageStorageService.bodyImageExists(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  async clearStaleBodyPhotoRefs(userId) {
    await this.bodyAnalysisRepository.clearBodyImageUrl(userId);

    const user = await this.bodyAnalysisRepository.findUserBodyImageContext(userId);

    if (!user?.profile) {
      return;
    }

    const preferences = { ...(user.profile.preferences || {}) };
    delete preferences.bodyPhoto;
    delete preferences.body_photo;
    delete preferences.onboardingBodyPhoto;
    delete preferences.bodyPhotoOriginal;
    delete preferences.bodyPhotoProcessed;
    delete preferences.transparentBodyPhoto;
    delete preferences.bodyPhotoProcessing;

    await this.bodyAnalysisRepository.updateProfileBodyImageRefs(userId, {
      body_image: null,
      preferences,
    });

    this.bodyPhotoProcessingService.removeTransparentPng(userId);
    this.logger.warn(`Cleared stale body photo references for user ${userId}`);
  }

  async resolveCanonicalBodyImagePath(userId, record = null) {
    const user = await this.bodyAnalysisRepository.findUserBodyImageContext(userId);
    const resolved = await this.resolveExistingBodyImagePath(userId, record, {
      profile: user?.profile,
    });

    if (resolved) {
      return resolved;
    }

    const hadStoredReference = Boolean(
      sanitizeBodyPhotoPath(record?.body_image_url)
      || sanitizeBodyPhotoPath(user?.profile?.body_image)
      || sanitizeBodyPhotoPath(user?.profile?.preferences?.bodyPhoto)
      || sanitizeBodyPhotoPath(user?.profile?.preferences?.body_photo)
      || sanitizeBodyPhotoPath(user?.profile?.preferences?.onboardingBodyPhoto),
    );

    if (hadStoredReference) {
      await this.clearStaleBodyPhotoRefs(userId);
    }

    return null;
  }

  async syncBodyPhotoToProfile(userId, bodyImagePath) {
    const sanitized = sanitizeBodyPhotoPath(bodyImagePath);

    if (!sanitized) {
      return;
    }

    const user = await this.bodyAnalysisRepository.findUserBodyImageContext(userId);

    if (!user?.profile) {
      return;
    }

    const preferences = {
      ...(user.profile.preferences || {}),
      bodyPhoto: sanitized,
    };

    await this.bodyAnalysisRepository.updateProfileBodyImageRefs(userId, {
      body_image: sanitized,
      preferences,
    });
  }



  async formatBodyAnalysisResponse(record, context = {}) {
    if (!record) {
      return {
        bodyImageUrl: null,
        bodyPhotoUrl: null,
        body_image_url: null,
        bodyPhotoOriginalUrl: null,
        bodyPhotoTransparentUrl: null,
        bodyPhotoProcessing: null,
        bodyPhotoMissing: false,
      };
    }

    const preferences = context?.profile?.preferences || {};
    const userId = record.user_id;
    let originalPath = resolveOriginalBodyImagePath(record, preferences);
    let bodyPhotoMissing = false;

    if (originalPath && !(await this.bodyImageStorageService.bodyImageExists(originalPath))) {
      bodyPhotoMissing = true;
      await this.clearStaleBodyPhotoRefs(userId);
      originalPath = null;
    }

    let transparentPath = null;

    if (originalPath) {
      const transparentCandidate = resolveTransparentBodyImagePath(userId, preferences);

      if (
        transparentCandidate
        && await this.bodyPhotoProcessingService.transparentPngExists(userId)
        && await this.bodyImageStorageService.bodyImageExists(transparentCandidate)
      ) {
        transparentPath = transparentCandidate;
      }
    }

    const displayPath = transparentPath || originalPath;

    return {
      ...formatBodyAnalysisRecord(record),
      body_image_url: originalPath,
      bodyImageUrl: displayPath
        ? this.storagePathResolver.toPublicUrl(displayPath)
        : null,
      bodyPhotoUrl: displayPath
        ? this.storagePathResolver.toPublicUrl(displayPath)
        : null,
      bodyPhotoOriginalUrl: originalPath
        ? this.storagePathResolver.toPublicUrl(originalPath)
        : null,
      bodyPhotoTransparentUrl: transparentPath
        ? this.storagePathResolver.toPublicUrl(transparentPath)
        : null,
      bodyPhotoProcessing: bodyPhotoMissing ? null : (preferences.bodyPhotoProcessing || null),
      bodyPhotoMissing,
    };
  }



  async replaceBodyPhoto(userId, imageDto) {

    if (!imageDto?.imageBuffer?.length) {

      return null;

    }



    const existing = await this.bodyAnalysisRepository.findByUserId(userId);



    return this.bodyImageStorageService.replaceBodyImage(

      userId,

      imageDto.imageBuffer,

      imageDto.imageMimeType,

      existing?.body_image_url,

    );

  }



  async analyzeBody(userId, imageDto) {
    if (!imageDto?.imageBuffer?.length && !imageDto?.videoBuffer?.length) {
      throw new BadRequestException('Provide an image and/or a walkaround video.');
    }

    if (!this.aiService.isConfigured()) {
      throw new ServiceUnavailableException('AI service unavailable.');
    }

    const user = await this.bodyAnalysisRepository.findUserBodyImageContext(userId);
    const height = imageDto.height ?? user?.profile?.height ?? null;

    if (!height || height <= 0) {
      throw new BadRequestException(
        'Height is required to calibrate body measurements. Add your height in profile or onboarding.',
      );
    }

    const bodyImagePath = await this.replaceBodyPhoto(userId, imageDto);

    if (bodyImagePath) {
      await this.bodyAnalysisRepository.saveBodyImagePath(userId, bodyImagePath);
      await this.syncBodyPhotoToProfile(userId, bodyImagePath);
      await this.bodyPhotoProcessingService.processAfterUpload(userId, bodyImagePath);
      await this.userMediaRegistryService.registerBodyPhoto(userId, bodyImagePath, {
        mimeType: imageDto.imageMimeType,
        fileSize: imageDto.imageBuffer?.length,
        uploadSource: 'body_analysis',
      });
    }

    return this.persistBodyTraitAnalysis(userId, { ...imageDto, height }, bodyImagePath);
  }

  async analyzeStoredBody(userId) {
    if (!this.aiService.isConfigured()) {
      throw new ServiceUnavailableException('AI service unavailable.');
    }

    let record = await this.bodyAnalysisRepository.findByUserId(userId);
    const bodyImagePath = await this.resolveCanonicalBodyImagePath(userId, record);

    if (!bodyImagePath) {
      throw new BadRequestException('Upload a body photo before running analysis.');
    }

    if (!record?.body_image_url || record.body_image_url !== bodyImagePath) {
      record = await this.bodyAnalysisRepository.saveBodyImagePath(userId, bodyImagePath);
      await this.syncBodyPhotoToProfile(userId, bodyImagePath);
    }

    const storedImage = await this.bodyImageStorageService.readBodyImage(bodyImagePath);

    if (!storedImage?.buffer?.length) {
      throw new BadRequestException(
        'Your saved body photo is no longer available. Upload a new photo to run analysis.',
      );
    }

    const user = await this.bodyAnalysisRepository.findUserBodyImageContext(userId);
    const height = record?.height ?? user?.profile?.height ?? null;

    if (!height || height <= 0) {
      throw new BadRequestException(
        'Height is required to calibrate body measurements. Update your profile height first.',
      );
    }

    return this.persistBodyTraitAnalysis(
      userId,
      {
        imageBuffer: storedImage.buffer,
        imageMimeType: storedImage.mimeType,
        height,
      },
      bodyImagePath,
    );
  }

  async persistBodyTraitAnalysis(userId, imageDto, bodyImagePath = null) {
    let aiResponse;

    try {
      aiResponse = await this.aiService.analyzeBodyTraits({
        imageBuffer: imageDto.imageBuffer,
        imageMimeType: imageDto.imageMimeType,
        videoBuffer: imageDto.videoBuffer,
        videoMimeType: imageDto.videoMimeType,
        height: imageDto.height,
      });
    } catch (error) {
      this.logger.error(
        `Body trait analysis failed for user ${userId}: ${error.message}`,
      );
      throw error;
    }

    const record = await this.bodyAnalysisRepository.saveAnalysisFromAi(
      userId,
      aiResponse,
      bodyImagePath,
    );

    await this.bodyAnalysisVectorService.syncUserVector(userId, record);

    this.fashionDnaRegenerationService.trigger(
      userId,
      REFRESH_SOURCES.BODY_ANALYSIS,
    );

    setImmediate(() => {
      this.pipelineEventBus.emit(PIPELINE_SIGNALS.BODY_ANALYSIS_COMPLETED, {
        userId,
      });
    });

    this.notificationsService.notifyProfileEvent(
      userId,
      APP_NOTIFICATION_TYPES.BODY_ANALYSIS_COMPLETED,
      'Body analysis completed',
      'Your body analysis report is ready to view.',
      '/body-analysis',
    ).catch(() => null);

    return this.enrichBodyAnalysisResponse(record);
  }



  async syncFromProfileUpdate(userId, profileDto) {

    const hasRelevantChange = ['height', 'weight', 'body_type'].some(

      (field) => profileDto[field] !== undefined,

    );



    if (!hasRelevantChange) {

      return null;

    }



    const existing = await this.bodyAnalysisRepository.findByUserId(userId);



    if (!existing) {

      return null;

    }



    const dto = {};



    if (profileDto.height !== undefined) {

      dto.height = profileDto.height;

    }



    if (!Object.keys(dto).length) {

      return await this.formatBodyAnalysisResponse(existing);

    }



    const record = await this.bodyAnalysisRepository.saveOrUpdateExtractedTraits(

      userId,

      dto,

    );



    if (!record) {

      return await this.formatBodyAnalysisResponse(existing);

    }

    const heightChanged = profileDto.height !== undefined
      && profileDto.height !== existing.height;
    const bodyImagePath = await this.resolveCanonicalBodyImagePath(userId, record);

    if (heightChanged && bodyImagePath && this.aiService.isConfigured()) {
      try {
        return await this.analyzeStoredBody(userId);
      } catch (error) {
        this.logger.warn(
          `Body re-analysis after height change failed for user ${userId}: ${error.message}`,
        );
      }
    }

    await this.bodyAnalysisVectorService.syncUserVector(userId, record);



    this.fashionDnaRegenerationService.trigger(

      userId,

      REFRESH_SOURCES.BODY_ANALYSIS,

    );



    return await this.formatBodyAnalysisResponse(record);

  }



  async updateBodyAnalysis(userId, dto) {

    const existing = await this.bodyAnalysisRepository.findByUserId(userId);



    const bodyType = dto.bodyType ?? existing?.body_type;

    const bodyShape = dto.bodyShape ?? existing?.body_shape;

    const shouldRefreshFitProfile =

      (dto.bodyType !== undefined || dto.bodyShape !== undefined) &&

      bodyType &&

      bodyShape;



    if (shouldRefreshFitProfile && this.aiService.isConfigured()) {

      try {

        const raw = existing?.raw_ai_response || {};

        const fitResponse = await this.aiService.generateFitProfile({

          bodyType,

          bodyShape,

          bodyTypeCode: raw.bodyTypeCode ?? null,

          bodyShapeCode: raw.bodyShapeCode ?? null,

          measurements: this.buildMeasurementsPayload(existing),

          bodyTypeRatios: raw.bodyTypeRatios ?? null,

          bodyShapeRatios: raw.bodyShapeRatios ?? null,

          widthMeasurementsCm: raw.widthMeasurementsCm ?? null,

        });



        if (fitResponse?.fitProfile) {

          dto.fitProfile = fitResponse.fitProfile;

        }

      } catch (error) {

        this.logger.warn(

          `Fit profile regeneration failed for user ${userId}: ${error.message}`,

        );

      }

    }



    const record = await this.bodyAnalysisRepository.saveOrUpdateExtractedTraits(

      userId,

      dto,

    );



    if (!record) {

      throw new BadRequestException('Provide at least one field to update');

    }



    await this.bodyAnalysisVectorService.syncUserVector(userId, record);



    this.fashionDnaRegenerationService.trigger(

      userId,

      REFRESH_SOURCES.BODY_ANALYSIS,

    );



    return await this.formatBodyAnalysisResponse(record);

  }

}


