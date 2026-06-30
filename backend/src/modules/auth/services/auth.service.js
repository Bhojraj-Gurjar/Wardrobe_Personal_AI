import { Inject, BadRequestException, ConflictException,
  ForbiddenException,
  Injectable,
  TooManyRequestsException,
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
const TOKEN_INVALID_AFTER_PREFIX = 'auth:token-invalid-after:';
const PASSWORD_CHANGE_ATTEMPT_PREFIX = 'auth:password-change:attempts:';
const PASSWORD_CHANGE_LOCK_PREFIX = 'auth:password-change:lock:';
const PASSWORD_CHANGE_MAX_ATTEMPTS = 5;
const PASSWORD_CHANGE_LOCK_SECONDS = 900;
const PASSWORD_CHANGE_ATTEMPT_WINDOW_SECONDS = 3600;

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

  async getMe(userId) {
    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.ensureActiveUser(user);

    return this.sanitizeUser(user);
  }

  async changePassword(userId, dto) {
    await this.assertPasswordChangeNotLocked(userId);

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException(
        'New password must be different from your current password',
      );
    }

    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.ensureActiveUser(user);

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password_hash,
    );

    if (!isCurrentPasswordValid) {
      await this.recordPasswordChangeFailure(userId);
      throw new BadRequestException('Current password is incorrect');
    }

    await this.recordPasswordChangeSuccess(userId);

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.authRepository.updatePassword(userId, passwordHash);
    await this.invalidateUserSessions(userId);

    const updatedUser = await this.authRepository.findById(userId);
    const tokens = await this.generateTokens(updatedUser);

    return {
      message: 'Password updated successfully',
      ...tokens,
    };
  }

  async assertPasswordChangeNotLocked(userId) {
    const lockKey = `${PASSWORD_CHANGE_LOCK_PREFIX}${userId}`;
    const locked = await this.redisService.get(lockKey);

    if (locked) {
      throw new TooManyRequestsException(
        'Too many failed password change attempts. Try again later.',
      );
    }
  }

  async recordPasswordChangeFailure(userId) {
    const attemptKey = `${PASSWORD_CHANGE_ATTEMPT_PREFIX}${userId}`;
    const attempts = await this.redisService.incr(attemptKey);

    if (attempts === 1) {
      await this.redisService.expire(attemptKey, PASSWORD_CHANGE_ATTEMPT_WINDOW_SECONDS);
    }

    if (attempts >= PASSWORD_CHANGE_MAX_ATTEMPTS) {
      const lockKey = `${PASSWORD_CHANGE_LOCK_PREFIX}${userId}`;
      await this.redisService.setex(lockKey, PASSWORD_CHANGE_LOCK_SECONDS, '1');
      await this.redisService.del(attemptKey);
      throw new TooManyRequestsException(
        'Too many failed password change attempts. Try again later.',
      );
    }
  }

  recordPasswordChangeSuccess(userId) {
    return this.redisService.del(`${PASSWORD_CHANGE_ATTEMPT_PREFIX}${userId}`);
  }

  async invalidateUserSessions(userId) {
    const invalidAfter = Math.floor(Date.now() / 1000);
    await this.redisService.set(
      `${TOKEN_INVALID_AFTER_PREFIX}${userId}`,
      String(invalidAfter),
    );
    await this.revokeAllRefreshTokensForUser(userId);
  }

  async revokeAllRefreshTokensForUser(userId) {
    let cursor = '0';

    do {
      const [nextCursor, keys] = await this.redisService.scan(
        cursor,
        'MATCH',
        `${REFRESH_TOKEN_PREFIX}*`,
        'COUNT',
        100,
      );
      cursor = nextCursor;

      for (const key of keys) {
        const storedUserId = await this.redisService.get(key);

        if (storedUserId === userId) {
          await this.redisService.del(key);
        }
      }
    } while (cursor !== '0');
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
