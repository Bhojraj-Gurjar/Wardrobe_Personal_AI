import {
  Inject,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { BodyAnalysisService } from '../body-analysis/body-analysis.service';
import { FaceAnalysisService } from '../face-analysis/face-analysis.service';
import { UsersRepository } from '../users/repositories/users.repository';
import { UserMediaRegistryService } from '../user-media/services/user-media-registry.service';
import { AiService } from '../ai/services/ai.service';

function resolveUserArtifacts(moduleRef) {
  const { UserArtifactsService } = require('../user-artifacts/user-artifacts.service');
  return moduleRef.get(UserArtifactsService, { strict: false });
}
import { StoragePathResolver } from '../../storage/services/storage-path-resolver.service';
import {
  buildProfileContext,
  enrichBodyTraits,
  enrichFaceTraits,
} from './utils/digital-avatar-context.util';
import { DigitalAvatarRepository } from './digital-avatar.repository';
import { AvatarImageStorageService } from './services/avatar-image-storage.service';
import { DigitalAvatarVectorService } from './services/digital-avatar-vector.service';
import { buildAvatarGenerationPayload } from './utils/avatar-generation-payload.util';
import {
  formatDigitalAvatarHistoryList,
  formatDigitalAvatarRecord,
} from './utils/digital-avatar.mapper';
import {
  AvatarTraitRequirement,
  getAvatarTraitRequirement,
  normalizeAvatarType,
} from './utils/avatar-type.util';
import { resolveAvatarGenerationStrategy } from './strategies/avatar-generation-strategy.registry';
import {
  hasBasicAvatarTraits,
  hasDigitalTwin3DTraits,
  hasPremiumAvatarTraits,
} from './utils/digital-avatar-context.util';
import {
  BASIC_AVATAR_TYPE,
  DEFAULT_AVATAR_TYPE,
  DIGITAL_TWIN_3D_AVATAR_TYPE,
  PREMIUM_AVATAR_TYPE,
} from './constants/digital-avatar.constants';

export @Injectable()
class DigitalAvatarService {
  constructor(
    @Inject(DigitalAvatarRepository) digitalAvatarRepository,
    @Inject(AvatarImageStorageService) avatarImageStorageService,
    @Inject(StoragePathResolver) storagePathResolver,
    @Inject(AiService) aiService,
    @Inject(FaceAnalysisService) faceAnalysisService,
    @Inject(BodyAnalysisService) bodyAnalysisService,
    @Inject(UsersRepository) usersRepository,
    @Inject(DigitalAvatarVectorService) digitalAvatarVectorService,
    @Inject(ModuleRef) moduleRef,
    @Inject(UserMediaRegistryService) userMediaRegistryService,
  ) {
    this.digitalAvatarRepository = digitalAvatarRepository;
    this.avatarImageStorageService = avatarImageStorageService;
    this.storagePathResolver = storagePathResolver;
    this.aiService = aiService;
    this.faceAnalysisService = faceAnalysisService;
    this.bodyAnalysisService = bodyAnalysisService;
    this.usersRepository = usersRepository;
    this.digitalAvatarVectorService = digitalAvatarVectorService;
    this.moduleRef = moduleRef;
    this.userMediaRegistryService = userMediaRegistryService;
    this.logger = new Logger(DigitalAvatarService.name);
  }

  async syncAvatarVector(userId, record) {
    try {
      await this.digitalAvatarVectorService.syncUserVector(userId, record);
    } catch (error) {
      this.logger.warn(
        `Digital avatar vector sync failed for user ${userId}: ${error.message}`,
      );
    }
  }

  formatRecord(record) {
    return formatDigitalAvatarRecord(
      record,
      this.storagePathResolver.toPublicUrl.bind(this.storagePathResolver),
    );
  }

  formatHistory(records) {
    return formatDigitalAvatarHistoryList(
      records,
      this.storagePathResolver.toPublicUrl.bind(this.storagePathResolver),
    );
  }

  async collectGenerationContext(userId) {
    const [profile, faceTraits, storedBodyTraits] = await Promise.all([
      this.usersRepository.findProfileByUserId(userId),
      this.faceAnalysisService.getStoredTraits(userId),
      this.bodyAnalysisService.getStoredTraits(userId),
    ]);

    let enrichedFaceTraits = faceTraits;
    let enrichedBodyTraits = storedBodyTraits;

    try {
      const fullFace = await this.faceAnalysisService.getMyFaceAnalysis(userId);
      enrichedFaceTraits = enrichFaceTraits(faceTraits, fullFace);
    } catch {
      enrichedFaceTraits = faceTraits;
    }

    try {
      const fullBody = await this.bodyAnalysisService.getMyBodyAnalysis(userId);
      enrichedBodyTraits = enrichBodyTraits(
        storedBodyTraits,
        fullBody,
        profile,
      );
    } catch {
      enrichedBodyTraits = enrichBodyTraits(storedBodyTraits, null, profile);
    }

    return {
      profile: buildProfileContext(profile),
      faceTraits: enrichedFaceTraits,
      bodyTraits: enrichedBodyTraits,
    };
  }

  hasGenerationTraits(context, avatarType = DEFAULT_AVATAR_TYPE) {
    const requirement = getAvatarTraitRequirement(avatarType);

    if (requirement === AvatarTraitRequirement.DIGITAL_TWIN) {
      return hasDigitalTwin3DTraits(context);
    }

    if (requirement === AvatarTraitRequirement.PREMIUM) {
      return hasPremiumAvatarTraits(context);
    }

    return hasBasicAvatarTraits(context);
  }

  validateGenerationTraits(context, avatarType) {
    const requirement = getAvatarTraitRequirement(avatarType);

    if (!this.hasGenerationTraits(context, avatarType)) {
      if (requirement === AvatarTraitRequirement.DIGITAL_TWIN) {
        throw new BadRequestException(
          '3D Digital Twin requires complete face, body, skin tone, hair, and beard analysis.',
        );
      }

      if (requirement === AvatarTraitRequirement.PREMIUM) {
        throw new BadRequestException(
          'Premium avatar requires face analysis, body analysis, skin tone, hair analysis, and beard analysis.',
        );
      }

      throw new BadRequestException(
        'Complete your profile, face analysis, and/or body analysis before generating an avatar.',
      );
    }
  }

  assertAvatarTypeSupported(avatarType) {
    const strategy = resolveAvatarGenerationStrategy(avatarType);

    if (!strategy.capabilities) {
      throw new BadRequestException(`Unsupported avatar type: ${avatarType}`);
    }

    if (!strategy.capabilities.implemented) {
      throw new HttpException(
        '3D Digital Twin generation is not available yet.',
        HttpStatus.NOT_IMPLEMENTED,
      );
    }

    return strategy;
  }

  async resolveNextVersion(userId) {
    const latest = await this.digitalAvatarRepository.getLatestVersion(userId);
    const nextVersion = (latest?.version || 0) + 1;

    const duplicate = await this.digitalAvatarRepository.findByUserIdAndVersion(
      userId,
      nextVersion,
    );

    if (duplicate) {
      throw new BadRequestException(
        `Avatar version ${nextVersion} already exists. Retry the operation.`,
      );
    }

    return nextVersion;
  }

  async persistGeneratedAvatar(userId, aiResponse, avatarType) {
    const canonicalType = normalizeAvatarType(
      aiResponse.avatarType || avatarType,
    );
    const nextVersion = await this.resolveNextVersion(userId);
    const { storagePath, rawAiResponse } =
      await this.avatarImageStorageService.persistAvatarGeneration(
        userId,
        nextVersion,
        aiResponse,
      );

    const record = await this.digitalAvatarRepository.createAndActivateAvatar(
      userId,
      {
        user_id: userId,
        avatar_type: canonicalType,
        avatar_image: storagePath,
        version: nextVersion,
        raw_ai_response: rawAiResponse,
      },
    );

    await this.userMediaRegistryService.registerAvatar(userId, storagePath, {
      mimeType: 'image/png',
      metadata: {
        avatarType: canonicalType,
        version: nextVersion,
      },
    });

    this.logger.log(
      `Digital avatar v${record.version} (${record.avatar_type}) activated for user ${userId}`,
    );

    await this.syncAvatarVector(userId, record);

    return this.formatRecord(record);
  }

  async generateBasicAvatar(userId) {
    return this.generateAvatar(userId, { avatarType: BASIC_AVATAR_TYPE });
  }

  async generatePremiumAvatar(userId) {
    return this.generateAvatar(userId, { avatarType: PREMIUM_AVATAR_TYPE });
  }

  async generateDigitalTwinAvatar(userId) {
    return this.generateAvatar(userId, { avatarType: DIGITAL_TWIN_3D_AVATAR_TYPE });
  }

  async getMyAvatar(userId) {
    return resolveUserArtifacts(this.moduleRef).ensureDigitalAvatar(userId);
  }

  async getAvatarHistory(userId) {
    const records = await this.digitalAvatarRepository.findHistoryByUserId(userId);

    return this.formatHistory(records);
  }

  async createVersionFromSource(userId, sourceRecord, updates) {
    const nextVersion = await this.resolveNextVersion(userId);
    const storagePath = await this.avatarImageStorageService.persistAvatarUpdate(
      userId,
      nextVersion,
      updates.avatarImage,
      sourceRecord.avatar_image,
    );

    const record = await this.digitalAvatarRepository.createAndActivateAvatar(
      userId,
      {
        user_id: userId,
        avatar_type: normalizeAvatarType(
          updates.avatarType ?? sourceRecord.avatar_type,
        ),
        avatar_image: storagePath,
        version: nextVersion,
        raw_ai_response: sourceRecord.raw_ai_response,
      },
    );

    this.logger.log(
      `Digital avatar v${record.version} (${record.avatar_type}) created from update for user ${userId}`,
    );

    await this.syncAvatarVector(userId, record);

    return this.formatRecord(record);
  }

  async activateAvatarById(userId, avatarId) {
    const ownedAvatar = await this.digitalAvatarRepository.findByIdAndUserId(
      userId,
      avatarId,
    );

    if (!ownedAvatar) {
      const existingAvatar = await this.digitalAvatarRepository.findById(avatarId);

      if (existingAvatar) {
        throw new ForbiddenException(
          'You cannot activate another user\'s avatar.',
        );
      }

      throw new NotFoundException('Digital avatar not found');
    }

    if (ownedAvatar.is_active) {
      return this.formatRecord(ownedAvatar);
    }

    const activated = await this.digitalAvatarRepository.activateAvatar(
      userId,
      avatarId,
    );

    if (!activated) {
      throw new NotFoundException('Digital avatar not found');
    }

    this.logger.log(
      `Digital avatar ${avatarId} (v${activated.version}) activated for user ${userId}`,
    );

    await this.syncAvatarVector(userId, activated);

    return this.formatRecord(activated);
  }

  async generateAvatar(userId, dto = {}) {
    if (!this.aiService.isConfigured()) {
      throw new ServiceUnavailableException('AI service unavailable.');
    }

    const context = await this.collectGenerationContext(userId);
    const strategy = this.assertAvatarTypeSupported(
      dto.avatarType || DEFAULT_AVATAR_TYPE,
    );
    const avatarType = strategy.canonicalType;

    this.validateGenerationTraits(context, avatarType);

    let aiResponse;

    try {
      aiResponse = await this.aiService.generateAvatar(
        buildAvatarGenerationPayload(context, strategy.aiAvatarType),
      );
    } catch (error) {
      this.logger.error(
        `Digital avatar generation failed for user ${userId}: ${error.message}`,
      );
      throw error;
    }

    return this.persistGeneratedAvatar(userId, aiResponse, avatarType);
  }

  async updateAvatar(userId, dto) {
    const hasContentUpdate =
      dto.avatarType !== undefined || dto.avatarImage !== undefined;
    const hasActivation = dto.isActive === true;

    if (!hasContentUpdate && !hasActivation) {
      throw new BadRequestException('Provide at least one field to update');
    }

    if (hasActivation && !hasContentUpdate) {
      if (!dto.avatarId) {
        throw new BadRequestException(
          'Provide avatarId to activate a historical avatar version',
        );
      }

      return this.activateAvatarById(userId, dto.avatarId);
    }

    let sourceRecord = null;

    if (dto.avatarId) {
      sourceRecord = await this.digitalAvatarRepository.findByIdAndUserId(
        userId,
        dto.avatarId,
      );
    }

    if (!sourceRecord) {
      sourceRecord = await this.digitalAvatarRepository.findActiveByUserId(userId);
    }

    if (!sourceRecord) {
      throw new NotFoundException(
        'No digital avatar found. Run POST /digital-avatar/generate first.',
      );
    }

    return this.createVersionFromSource(userId, sourceRecord, dto);
  }
}
