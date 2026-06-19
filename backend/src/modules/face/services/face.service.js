import { Inject, BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { FaceRepository } from '../repositories/face.repository';
import { RedisService } from '../../../database/redis.service';
import { USER_STATUS } from '../../../common/constants/user-status';
import { parseDurationToSeconds } from '../../../common/utils/parse-duration';

const REFRESH_TOKEN_PREFIX = 'auth:refresh:';

export @Injectable()
class FaceService {
  constructor(@Inject(FaceRepository) faceRepository, @Inject(JwtService) jwtService, @Inject(ConfigService) configService, @Inject(RedisService) redisService) {
    this.faceRepository = faceRepository;
    this.jwtService = jwtService;
    this.configService = configService;
    this.redisService = redisService;
    this.vectorSize = configService.get('face.vectorSize');
    this.similarityThreshold = configService.get('face.similarityThreshold');
    this.refreshTtlSeconds = parseDurationToSeconds(
      configService.get('jwt.refreshExpiresIn'),
    );
  }

  async register(userId, dto) {
    this.ensureQdrantConfigured();
    this.validateEmbedding(dto.embedding);

    await this.faceRepository.upsertFaceVector(userId, dto.embedding);

    return {
      message: 'Face registered successfully',
      user_id: userId,
    };
  }

  async login(dto) {
    this.ensureQdrantConfigured();
    this.validateEmbedding(dto.embedding);

    const matches = await this.faceRepository.searchFaceVector(dto.embedding);

    if (!matches.length) {
      throw new UnauthorizedException('Face not recognized');
    }

    const bestMatch = matches[0];

    if (bestMatch.score < this.similarityThreshold) {
      throw new UnauthorizedException('Face not recognized');
    }

    const userId = bestMatch.payload?.user_id || bestMatch.id;
    const user = await this.faceRepository.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('Face not recognized');
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new ForbiddenException('Account is not active');
    }

    return this.buildAuthResponse(user, bestMatch.score);
  }

  async verify(userId, dto) {
    this.ensureQdrantConfigured();
    this.validateEmbedding(dto.embedding);

    const matches = await this.faceRepository.searchFaceVector(dto.embedding);

    if (!matches.length) {
      throw new UnauthorizedException('Face verification failed');
    }

    const bestMatch = matches[0];
    const matchUserId = bestMatch.payload?.user_id || bestMatch.id;

    if (String(matchUserId) !== String(userId)) {
      throw new UnauthorizedException('Face verification failed');
    }

    if (bestMatch.score < this.similarityThreshold) {
      throw new UnauthorizedException('Face verification failed');
    }

    return {
      message: 'Face verified successfully',
      similarity_score: Number(bestMatch.score.toFixed(4)),
    };
  }

  ensureQdrantConfigured() {
    if (!this.configService.get('qdrant.url')) {
      throw new ServiceUnavailableException(
        'Face authentication requires Qdrant configuration',
      );
    }
  }

  validateEmbedding(embedding) {
    if (embedding.length !== this.vectorSize) {
      throw new BadRequestException(
        `Embedding must contain exactly ${this.vectorSize} values`,
      );
    }
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
