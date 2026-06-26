import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { sanitizeBodyPhotoPath } from '../../../common/utils/user-image-guard.util';
import { ApiCacheService } from '../../../common/services/api-cache.service';
import { resolveProfileRegenerationSource } from '../../fashion-dna/constants/fashion-dna-regeneration.constants';
import { FashionDnaRegenerationService } from '../../fashion-dna/services/fashion-dna-regeneration.service';
import { BodyAnalysisService } from '../../body-analysis/body-analysis.service';
import { BodyPhotoProcessingService } from '../../body-analysis/services/body-photo-processing.service';
import {
  resolveOriginalBodyImagePath,
  resolveTransparentBodyImagePath,
} from '../../body-analysis/utils/body-photo-display.util';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { PIPELINE_SIGNALS, PipelineEventBus } from '../../user-pipeline/pipeline-event.bus';
import { UserArtifactsService } from '../../user-artifacts/user-artifacts.service';
import { UsersRepository } from '../repositories/users.repository';

export @Injectable()
class UsersService {
  constructor(
    @Inject(UsersRepository) usersRepository,
    @Inject(FashionDnaRegenerationService) fashionDnaRegenerationService,
    @Inject(forwardRef(() => BodyAnalysisService))
    bodyAnalysisService,
    @Inject(PipelineEventBus) pipelineEventBus,
    @Inject(UserArtifactsService) userArtifactsService,
    @Inject(StoragePathResolver) storagePathResolver,
    @Inject(ApiCacheService) apiCacheService,
    @Inject(BodyPhotoProcessingService) bodyPhotoProcessingService,
  ) {
    this.usersRepository = usersRepository;
    this.fashionDnaRegenerationService = fashionDnaRegenerationService;
    this.bodyAnalysisService = bodyAnalysisService;
    this.pipelineEventBus = pipelineEventBus;
    this.userArtifactsService = userArtifactsService;
    this.storagePathResolver = storagePathResolver;
    this.apiCacheService = apiCacheService;
    this.bodyPhotoProcessingService = bodyPhotoProcessingService;
  }

  profileCacheKey(userId) {
    return this.apiCacheService.buildKey('users:profile', userId);
  }

  async getProfile(userId) {
    return this.apiCacheService.getOrSet(
      this.profileCacheKey(userId),
      120,
      async () => {
        const context = await this.usersRepository.findProfileContextByUserId(userId);

        if (!context?.profile) {
          throw new NotFoundException('Profile not found');
        }

        return this.formatProfile(context.profile, context);
      },
    );
  }

  async updateProfile(userId, dto) {
    await this.ensureProfileExists(userId);

    const profile = await this.usersRepository.updateProfileByUserId(
      userId,
      this.mapDtoToProfileData(dto),
    );

    this.fashionDnaRegenerationService.trigger(
      userId,
      resolveProfileRegenerationSource(dto),
    );

    await this.bodyAnalysisService.syncFromProfileUpdate(userId, dto);

    setImmediate(() => {
      this.pipelineEventBus.emit(PIPELINE_SIGNALS.PROFILE_UPDATED, { userId });
    });

    const context = await this.usersRepository.findProfileContextByUserId(userId);

    await this.apiCacheService.invalidate(this.profileCacheKey(userId));

    return this.formatProfile(profile, context);
  }

  async ensureProfileExists(userId) {
    const profile = await this.usersRepository.findProfileByUserId(userId);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  mapDtoToProfileData(dto) {
    const data = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.gender !== undefined) {
      data.gender = dto.gender;
    }

    if (dto.age !== undefined) {
      data.age = dto.age;
    }

    if (dto.height !== undefined) {
      data.height = dto.height;
    }

    if (dto.weight !== undefined) {
      data.weight = dto.weight;
    }

    if (dto.country !== undefined) {
      data.country = dto.country;
    }

    if (dto.language !== undefined) {
      data.language = dto.language;
    }

    if (dto.body_type !== undefined) {
      data.body_type = dto.body_type;
    }

    if (dto.skin_tone !== undefined) {
      data.skin_tone = dto.skin_tone;
    }

    if (dto.preferences !== undefined) {
      data.preferences = dto.preferences;
    }

    return data;
  }

  formatProfile(profile, context = {}) {
    const faceImagePath = context.face_registration?.face_image_url || null;
    const preferences = profile.preferences || {};
    const userId = profile.user_id;
    const originalPath = resolveOriginalBodyImagePath(context.body_analysis, preferences)
      || sanitizeBodyPhotoPath(context.body_analysis?.body_image_url)
      || sanitizeBodyPhotoPath(preferences.bodyPhoto)
      || sanitizeBodyPhotoPath(preferences.body_photo)
      || sanitizeBodyPhotoPath(profile.body_image)
      || null;
    const transparentCandidate = resolveTransparentBodyImagePath(userId, preferences);
    const transparentPath = transparentCandidate
      && this.bodyPhotoProcessingService.transparentPngExists(userId)
      ? transparentCandidate
      : null;
    const displayPath = transparentPath || originalPath;

    return {
      id: profile.id,
      user_id: profile.user_id,
      name: profile.name,
      email: context.email || null,
      gender: profile.gender,
      age: profile.age,
      height: profile.height,
      weight: profile.weight,
      country: profile.country,
      language: profile.language,
      body_type: profile.body_type,
      skin_tone: profile.skin_tone,
      preferences: profile.preferences,
      is_face_registered: context.face_registration?.is_face_registered ?? false,
      face_image_url: faceImagePath,
      faceImageUrl: this.storagePathResolver.toPublicUrl(faceImagePath),
      body_image: originalPath,
      body_image_url: originalPath,
      bodyImageUrl: this.storagePathResolver.toPublicUrl(displayPath),
      bodyPhotoUrl: this.storagePathResolver.toPublicUrl(displayPath),
      bodyPhotoOriginalUrl: this.storagePathResolver.toPublicUrl(originalPath),
      bodyPhotoTransparentUrl: this.storagePathResolver.toPublicUrl(transparentPath),
      bodyPhotoProcessing: preferences.bodyPhotoProcessing || null,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }

  ensureArtifacts(userId) {
    return this.userArtifactsService.ensureAllUserArtifacts(userId);
  }
}
