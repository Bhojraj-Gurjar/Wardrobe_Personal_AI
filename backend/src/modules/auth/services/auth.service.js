import { Inject, ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException, forwardRef, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { AuthRepository } from '../repositories/auth.repository';
import { RedisService } from '../../../database/redis.service';
import { UserPipelineService } from '../../user-pipeline/user-pipeline.service';
import { UserArtifactsService } from '../../user-artifacts/user-artifacts.service';
import { USER_STATUS } from '../../../common/constants/user-status';
import { parseDurationToSeconds } from '../../../common/utils/parse-duration';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_PREFIX = 'auth:refresh:';

export @Injectable()
class AuthService {
  constructor(
    @Inject(AuthRepository) authRepository,
    @Inject(JwtService) jwtService,
    @Inject(ConfigService) configService,
    @Inject(RedisService) redisService,
    @Inject(forwardRef(() => UserPipelineService)) userPipelineService,
    @Inject(UserArtifactsService) userArtifactsService,
  ) {
    this.authRepository = authRepository;
    this.jwtService = jwtService;
    this.configService = configService;
    this.redisService = redisService;
    this.userPipelineService = userPipelineService;
    this.userArtifactsService = userArtifactsService;
    this.logger = new Logger(AuthService.name);
    this.refreshTtlSeconds = parseDurationToSeconds(
      this.configService.get('jwt.refreshExpiresIn'),
    );
  }

  async register(dto) {
    await this.ensureUniqueCredentials(dto.email, dto.mobile);

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.authRepository.createUserWithProfile({
      email: dto.email,
      mobile: dto.mobile,
      passwordHash,
    });

    this.userPipelineService.onUserCreated(user.id);
    const response = await this.buildAuthResponse(user);
    this.scheduleArtifactEnsure(user.id);

    return response;
  }

  async login(dto) {
    const user = dto.email
      ? await this.authRepository.findByEmail(dto.email)
      : await this.authRepository.findByMobile(dto.mobile);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.ensureActiveUser(user);

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const response = await this.buildAuthResponse(user);
    this.scheduleArtifactEnsure(user.id);

    return response;
  }

  async refresh(dto) {
    const userId = await this.getUserIdFromRefreshToken(dto.refreshToken);

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.authRepository.findById(userId);

    if (!user) {
      await this.revokeRefreshToken(dto.refreshToken);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.ensureActiveUser(user);
    await this.revokeRefreshToken(dto.refreshToken);

    const response = await this.buildAuthResponse(user);
    this.scheduleArtifactEnsure(user.id);

    return response;
  }

  async logout(dto) {
    await this.revokeRefreshToken(dto.refreshToken);

    return { message: 'Logged out successfully' };
  }

  async ensureUniqueCredentials(email, mobile) {
    const existingEmail = await this.authRepository.findByEmail(email);

    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }

    if (!mobile) {
      return;
    }

    const existingMobile = await this.authRepository.findByMobile(mobile);

    if (existingMobile) {
      throw new ConflictException('Mobile number is already registered');
    }
  }

  async ensureActiveUser(user) {
    if (user.status !== USER_STATUS.ACTIVE) {
      throw new ForbiddenException('Account is not active');
    }
  }

  async buildAuthResponse(user) {
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
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

    await this.storeRefreshToken(refreshToken, user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get('jwt.expiresIn'),
    };
  }

  storeRefreshToken(refreshToken, userId) {
    return this.redisService.setex(
      `${REFRESH_TOKEN_PREFIX}${refreshToken}`,
      this.refreshTtlSeconds,
      userId,
    );
  }

  async getUserIdFromRefreshToken(refreshToken) {
    return this.redisService.get(`${REFRESH_TOKEN_PREFIX}${refreshToken}`);
  }

  revokeRefreshToken(refreshToken) {
    return this.redisService.del(`${REFRESH_TOKEN_PREFIX}${refreshToken}`);
  }

  scheduleArtifactEnsure(userId) {
    setImmediate(() => {
      this.userArtifactsService.ensureAllUserArtifacts(userId).catch((error) => {
        this.logger.warn(
          `Artifact ensure failed for user ${userId}: ${error.message}`,
        );
      });
    });
  }
}
