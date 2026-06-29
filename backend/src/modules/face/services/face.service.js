import {
  Inject,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  TooManyRequestsException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { FaceRepository } from '../repositories/face.repository';
import { FaceImageStorageService } from './face-image-storage.service';
import { FaceRateLimitService } from './face-rate-limit.service';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { RedisService } from '../../../database/redis.service';
import { AiService } from '../../ai/services/ai.service';
import { REFRESH_SOURCES } from '../../fashion-dna/constants/fashion-dna-regeneration.constants';
import { FashionDnaRegenerationService } from '../../fashion-dna/services/fashion-dna-regeneration.service';
import { UserPipelineService } from '../../user-pipeline/user-pipeline.service';
import { UserMediaRegistryService } from '../../user-media/services/user-media-registry.service';
import { USER_STATUS } from '../../../common/constants/user-status';
import { parseDurationToSeconds } from '../../../common/utils/parse-duration';

const REFRESH_TOKEN_PREFIX = 'auth:refresh:';

export @Injectable()
class FaceService {
  constructor(
    @Inject(FaceRepository) faceRepository,
    @Inject(FaceImageStorageService) faceImageStorageService,
    @Inject(FaceRateLimitService) faceRateLimitService,
    @Inject(StoragePathResolver) storagePathResolver,
    @Inject(JwtService) jwtService,
    @Inject(ConfigService) configService,
    @Inject(RedisService) redisService,
    @Inject(AiService) aiService,
    @Inject(FashionDnaRegenerationService) fashionDnaRegenerationService,
    @Inject(forwardRef(() => UserPipelineService)) userPipelineService,
    @Inject(UserMediaRegistryService) userMediaRegistryService,
  ) {
    this.faceRepository = faceRepository;
    this.faceImageStorageService = faceImageStorageService;
    this.faceRateLimitService = faceRateLimitService;
    this.storagePathResolver = storagePathResolver;
    this.jwtService = jwtService;
    this.configService = configService;
    this.redisService = redisService;
    this.aiService = aiService;
    this.fashionDnaRegenerationService = fashionDnaRegenerationService;
    this.userPipelineService = userPipelineService;
    this.userMediaRegistryService = userMediaRegistryService;
    this.logger = new Logger(FaceService.name);
    this.refreshTtlSeconds = parseDurationToSeconds(
      configService.get('jwt.refreshExpiresIn'),
    );
  }

  async register(userId, dto) {
    this.logger.log(`STEP 5 NestJS → FastAPI | path=/face/register | userId=${userId}`);

    const registration = await this.replaceFacePhoto(userId, dto);

    this.logger.log(`STEP 8 registration completed | userId=${userId}`);

    this.userPipelineService.onFaceRegistered(userId, {
      imageBuffer: dto.imageBuffer,
      imageMimeType: dto.imageMimeType,
    });

    this.fashionDnaRegenerationService.trigger(
      userId,
      REFRESH_SOURCES.FACE_ANALYSIS,
    );

    return this.formatRegistrationResponse(userId, registration);
  }

  async updatePhoto(userId, dto) {
    const existing = await this.faceRepository.findFaceRegistration(userId);

    if (!existing?.is_face_registered) {
      throw new BadRequestException('Register a face before changing your photo.');
    }

    const registration = await this.replaceFacePhoto(userId, dto);

    this.userPipelineService.onFaceRegistered(userId, {
      imageBuffer: dto.imageBuffer,
      imageMimeType: dto.imageMimeType,
    });

    this.fashionDnaRegenerationService.trigger(
      userId,
      REFRESH_SOURCES.FACE_ANALYSIS,
    );

    return {
      ...this.formatRegistrationResponse(userId, registration),
      message: 'Face photo updated successfully',
    };
  }

  async replaceFacePhoto(userId, dto) {
    if (!dto.imageBuffer?.length) {
      throw new BadRequestException('Provide a frontFace image upload.');
    }

    if (!this.aiService.isConfigured()) {
      throw new ServiceUnavailableException('AI service unavailable.');
    }

    const staleCleanup = await this.faceRepository.purgeStaleFaceVectors();
    if (staleCleanup.deleted > 0) {
      this.logger.warn(
        `Removed ${staleCleanup.deleted} stale face vector(s) referencing deleted users`,
      );
    }

    try {
      const aiResult = await this.aiService.registerFace(userId, dto);
      const livenessMeta = {
        livenessScore: aiResult?.liveness_score ?? aiResult?.livenessScore ?? null,
        blinkDetected: dto.challengeType === 'blink_once' || dto.challengeType === 'blink_twice',
        smileDetected: dto.challengeType === 'smile',
      };

      const existing = await this.faceRepository.findFaceRegistration(userId);
      const faceImagePath = await this.faceImageStorageService.replaceFaceImage(
        userId,
        dto.imageBuffer,
        dto.imageMimeType,
        existing?.face_image_url,
      );

      await this.userMediaRegistryService.registerFacePhoto(userId, faceImagePath, {
        mimeType: dto.imageMimeType,
        fileSize: dto.imageBuffer?.length,
        uploadSource: 'face_registration',
      });

      return this.faceRepository.upsertFaceRegistration(userId, faceImagePath, livenessMeta);
    } catch (error) {
      this.rethrowAiError(error);
    }
  }

  formatRegistrationResponse(userId, registration) {
    const faceImagePath = registration?.face_image_url || null;

    return {
      message: 'Face registered successfully',
      user_id: userId,
      face_embedding_id: userId,
      is_face_registered: true,
      face_image_url: faceImagePath,
      faceImageUrl: this.storagePathResolver.toPublicUrl(faceImagePath),
      registered_at: registration?.registered_at,
      updated_at: registration?.updated_at,
    };
  }

  async getFacePhoto(userId) {
    const registration = await this.faceRepository.findFaceRegistration(userId);

    if (!registration?.is_face_registered) {
      return {
        is_face_registered: false,
        face_image_url: null,
        faceImageUrl: null,
      };
    }

    return {
      is_face_registered: true,
      face_image_url: registration.face_image_url,
      faceImageUrl: this.storagePathResolver.toPublicUrl(registration.face_image_url),
      registered_at: registration.registered_at,
      updated_at: registration.updated_at,
    };
  }

  async login(dto, context = {}) {
    if (!dto.imageBuffer?.length) {
      throw new BadRequestException('Provide a frontFace image upload.');
    }

    if (!this.aiService.isConfigured()) {
      throw new ServiceUnavailableException('AI service unavailable.');
    }

    const rateLimitKey = context.clientIp || 'anonymous';

    await this.faceRateLimitService.assertNotLocked('login', rateLimitKey);
    this.logFaceAudit('login_attempt', {
      clientIp: context.clientIp,
      userAgent: context.userAgent,
      captureSessionId: dto.captureSessionId,
      challengeType: dto.challengeType,
      frameCount: dto.livenessFrames?.length || 1,
    });

    let result;

    try {
      result = await this.aiService.loginFace(dto);
    } catch (error) {
      if (
        error instanceof UnauthorizedException
        || error instanceof BadRequestException
      ) {
        try {
          await this.faceRateLimitService.recordFailure('login', rateLimitKey, {
            reason: error.message,
            challengeType: dto.challengeType,
          });
        } catch (lockError) {
          if (lockError instanceof TooManyRequestsException) {
            throw lockError;
          }
        }
      }

      this.logFaceAudit('login_failed', {
        clientIp: context.clientIp,
        reason: error.message,
        challengeType: dto.challengeType,
      });
      this.rethrowAiError(error);
    }

    const user = await this.faceRepository.findUserById(result.user_id);

    if (!user) {
      await this.faceRateLimitService.recordFailure('login', rateLimitKey, {
        reason: 'user_not_found',
      });
      throw new UnauthorizedException('Face not recognized.');
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new ForbiddenException('Account is not active');
    }

    await this.faceRateLimitService.recordSuccess('login', rateLimitKey);
    this.logFaceAudit('login_success', {
      userId: user.id,
      clientIp: context.clientIp,
      challengeType: dto.challengeType,
    });

    return this.buildAuthResponse(user);
  }

  async verify(userId, dto) {
    if (!dto.imageBuffer?.length) {
      throw new BadRequestException('Face image is required.');
    }

    if (!this.aiService.isConfigured()) {
      throw new ServiceUnavailableException('AI service unavailable.');
    }

    try {
      return await this.aiService.verifyFace(userId, dto.imageBuffer, dto.imageMimeType);
    } catch (error) {
      this.rethrowAiError(error);
    }
  }

  async logout(userId, dto) {
    if (!dto.imageBuffer?.length) {
      throw new BadRequestException('Face image is required.');
    }

    if (!this.aiService.isConfigured()) {
      throw new ServiceUnavailableException('AI service unavailable.');
    }

    const registration = await this.faceRepository.findFaceRegistration(userId);

    if (!registration?.is_face_registered) {
      throw new BadRequestException('Register a face before using face logout verification.');
    }

    let result;

    try {
      result = await this.aiService.logoutFace(userId, dto.imageBuffer, dto.imageMimeType);
    } catch (error) {
      this.rethrowAiError(error);
    }

    const logoutNonce = randomUUID();

    await this.redisService.setex(
      `auth:logout-nonce:${userId}:${logoutNonce}`,
      120,
      '1',
    );

    return {
      verified: true,
      similarity_score: result?.similarity_score ?? result?.similarityScore ?? null,
      logoutNonce,
      message: 'Face verified for logout',
    };
  }

  rethrowAiError(error) {
    if (
      error instanceof BadRequestException
      || error instanceof UnauthorizedException
      || error instanceof ConflictException
      || error instanceof ServiceUnavailableException
      || error instanceof TooManyRequestsException
    ) {
      throw error;
    }

    throw new ServiceUnavailableException('AI service unavailable.');
  }

  logFaceAudit(event, meta = {}) {
    this.logger.log(`FACE_AUDIT | event=${event} | ${JSON.stringify(meta)}`);
  }

  async buildAuthResponse(user) {
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      faceVerified: true,
      message: 'Face verified',
      ...tokens,
    };
  }

  sanitizeUser(user) {
    return {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      role: user.role || 'USER',
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  async generateTokens(user) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = randomUUID();

    await this.redisService.setex(
      `${REFRESH_TOKEN_PREFIX}${refreshToken}`,
      this.refreshTtlSeconds,
      user.id,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get('jwt.expiresIn'),
    };
  }
}
