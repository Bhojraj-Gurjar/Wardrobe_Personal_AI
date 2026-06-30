import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../database/redis.service';

const TOKEN_INVALID_AFTER_PREFIX = 'auth:token-invalid-after:';

export @Injectable()
class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService) configService,
    @Inject(RedisService) redisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
    this.redisService = redisService;
  }

  async validate(payload) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token');
    }

    const invalidAfter = await this.redisService.get(
      `${TOKEN_INVALID_AFTER_PREFIX}${payload.sub}`,
    );

    if (invalidAfter && payload.iat && payload.iat < Number(invalidAfter)) {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
