import {
  Inject,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { FaceRepository } from '../repositories/face.repository';
import { FaceImageStorageService } from './face-image-storage.service';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { RedisService } from '../../../database/redis.service';
import { AiService } from '../../ai/services/ai.service';
import { REFRESH_SOURCES } from '../../fashion-dna/constants/fashion-dna-regeneration.constants';
import { FashionDnaRegenerationService } from '../../fashion-dna/services/fashion-dna-regeneration.service';
import { UserPipelineService } from '../../user-pipeline/user-pipeline.service';
import { USER_STATUS } from '../../../common/constants/user-status';
import { parseDurationToSeconds } from '../../../common/utils/parse-duration';

const REFRESH_TOKEN_PREFIX = 'auth:refresh:';

export @Injectable()
class FaceService {
  constructor(
    @Inject(FaceRepository) faceRepository,
    @Inject(FaceImageStorageService) faceImageStorageService,
    @Inject(StoragePathResolver) storagePathResolver,
    @Inject(JwtService) jwtService,
    @Inject(ConfigService) configService,
    @Inject(RedisService) redisService,
    @Inject(AiService) aiService,
    @Inject(FashionDnaRegenerationService) fashionDnaRegenerationService,
    @Inject(forwardRef(() => UserPipelineService)) userPipelineService,
  ) {
    this.faceRepository = faceRepository;
    this.faceImageStorageService = faceImageStorageService;
    this.storagePathResolver = storagePathResolver;
    this.jwtService = jwtService;
    this.configService = configService;
    this.redisService = redisService;
    this.aiService = aiService;
    this.fashionDnaRegenerationService = fashionDnaRegenerationService;
    this.userPipelineService = userPipelineService;
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
      await this.aiService.registerFace(userId, dto.imageBuffer, dto.imageMimeType);
    } catch (error) {
      this.rethrowAiError(error);
    }

    const existing = await this.faceRepository.findFaceRegistration(userId);
    const faceImagePath = await this.faceImageStorageService.replaceFaceImage(
      userId,
      dto.imageBuffer,
      dto.imageMimeType,
      existing?.face_image_url,
    );

    return this.faceRepository.upsertFaceRegistration(userId, faceImagePath);
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

  async login(dto) {
    if (!dto.imageBuffer?.length) {
      throw new BadRequestException('Provide a frontFace image upload.');
    }

    if (!this.aiService.isConfigured()) {
      throw new ServiceUnavailableException('AI service unavailable.');
    }

    let result;

    try {
      result = await this.aiService.loginFace(dto.imageBuffer, dto.imageMimeType);
    } catch (error) {
      this.rethrowAiError(error);
    }

    const user = await this.faceRepository.findUserById(result.user_id);

    if (!user) {
      throw new UnauthorizedException('Face not recognized.');
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new ForbiddenException('Account is not active');
    }

    return this.buildAuthResponse(user, result.similarity_score);
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

  rethrowAiError(error) {
    if (
      error instanceof BadRequestException
      || error instanceof UnauthorizedException
      || error instanceof ConflictException
      || error instanceof ServiceUnavailableException
    ) {
      throw error;
    }

    throw new ServiceUnavailableException('AI service unavailable.');
  }

  async buildAuthResponse(user, similarityScore) {
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      similarity_score: Number(similarityScore.toFixed(4)),
      ...tokens,
    };
  }

  sanitizeUser(user) {
    return {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
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
