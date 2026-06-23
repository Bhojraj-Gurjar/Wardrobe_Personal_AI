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

import { BodyAnalysisRepository } from './body-analysis.repository';

import { BodyAnalysisVectorService } from './services/body-analysis-vector.service';

import { BodyImageStorageService } from './services/body-image-storage.service';

import { StoragePathResolver } from '../../storage/services/storage-path-resolver.service';

import { AiService } from '../ai/services/ai.service';

import { REFRESH_SOURCES } from '../fashion-dna/constants/fashion-dna-regeneration.constants';

import { FashionDnaRegenerationService } from '../fashion-dna/services/fashion-dna-regeneration.service';

import { PIPELINE_SIGNALS, PipelineEventBus } from '../user-pipeline/pipeline-event.bus';

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

    @Inject(StoragePathResolver) storagePathResolver,

    @Inject(AiService) aiService,

    @Inject(forwardRef(() => FashionDnaRegenerationService))

    fashionDnaRegenerationService,

    @Inject(PipelineEventBus) pipelineEventBus,

    @Inject(ModuleRef) moduleRef,

  ) {

    this.bodyAnalysisRepository = bodyAnalysisRepository;

    this.bodyAnalysisVectorService = bodyAnalysisVectorService;

    this.bodyImageStorageService = bodyImageStorageService;

    this.storagePathResolver = storagePathResolver;

    this.aiService = aiService;

    this.fashionDnaRegenerationService = fashionDnaRegenerationService;

    this.pipelineEventBus = pipelineEventBus;

    this.moduleRef = moduleRef;

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



    if (record && !record.body_image_url) {

      const repairedPath = await this.bodyImageStorageService.findStoredBodyImagePath(userId);

      if (repairedPath) {

        this.logger.warn(

          `Repaired missing body_image_url for user ${userId} from stored file`,

        );

        record = await this.bodyAnalysisRepository.saveBodyImagePath(userId, repairedPath);

      }

    }



    return this.formatBodyAnalysisResponse(record);

  }



  formatBodyAnalysisResponse(record) {

    if (!record) {

      return {

        bodyImageUrl: null,

        bodyPhotoUrl: null,

        body_image_url: null,

      };

    }



    const bodyImagePath = record.body_image_url || null;

    const bodyImageUrl = this.storagePathResolver.toPublicUrl(bodyImagePath);



    return {

      ...formatBodyAnalysisRecord(record),

      body_image_url: bodyImagePath,

      bodyImageUrl,

      bodyPhotoUrl: bodyImageUrl,

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



    const bodyImagePath = await this.replaceBodyPhoto(userId, imageDto);



    if (bodyImagePath) {

      await this.bodyAnalysisRepository.saveBodyImagePath(userId, bodyImagePath);

    }



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



    return this.formatBodyAnalysisResponse(record);

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

      return this.formatBodyAnalysisResponse(existing);

    }



    const record = await this.bodyAnalysisRepository.saveOrUpdateExtractedTraits(

      userId,

      dto,

    );



    if (!record) {

      return this.formatBodyAnalysisResponse(existing);

    }



    await this.bodyAnalysisVectorService.syncUserVector(userId, record);



    this.fashionDnaRegenerationService.trigger(

      userId,

      REFRESH_SOURCES.BODY_ANALYSIS,

    );



    return this.formatBodyAnalysisResponse(record);

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



    return this.formatBodyAnalysisResponse(record);

  }

}


