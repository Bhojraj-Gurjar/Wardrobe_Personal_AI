"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FaceService", {
    enumerable: true,
    get: function() {
        return FaceService;
    }
});
const _common = require("@nestjs/common");
const _jwt = require("@nestjs/jwt");
const _config = require("@nestjs/config");
const _crypto = require("crypto");
const _facerepository = require("../repositories/face.repository");
const _redisservice = require("../../../database/redis.service");
const _userstatus = require("../../../common/constants/user-status");
const _parseduration = require("../../../common/utils/parse-duration");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
const REFRESH_TOKEN_PREFIX = 'auth:refresh:';
let FaceService = class FaceService {
    constructor(faceRepository, jwtService, configService, redisService){
        this.faceRepository = faceRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.redisService = redisService;
        this.vectorSize = configService.get('face.vectorSize');
        this.similarityThreshold = configService.get('face.similarityThreshold');
        this.refreshTtlSeconds = (0, _parseduration.parseDurationToSeconds)(configService.get('jwt.refreshExpiresIn'));
    }
    async register(userId, dto) {
        this.ensureQdrantConfigured();
        this.validateEmbedding(dto.embedding);
        await this.faceRepository.upsertFaceVector(userId, dto.embedding);
        return {
            message: 'Face registered successfully',
            user_id: userId
        };
    }
    async login(dto) {
        this.ensureQdrantConfigured();
        this.validateEmbedding(dto.embedding);
        const matches = await this.faceRepository.searchFaceVector(dto.embedding);
        if (!matches.length) {
            throw new _common.UnauthorizedException('Face not recognized');
        }
        const bestMatch = matches[0];
        if (bestMatch.score < this.similarityThreshold) {
            throw new _common.UnauthorizedException('Face not recognized');
        }
        const userId = bestMatch.payload?.user_id || bestMatch.id;
        const user = await this.faceRepository.findUserById(userId);
        if (!user) {
            throw new _common.UnauthorizedException('Face not recognized');
        }
        if (user.status !== _userstatus.USER_STATUS.ACTIVE) {
            throw new _common.ForbiddenException('Account is not active');
        }
        return this.buildAuthResponse(user, bestMatch.score);
    }
    async verify(userId, dto) {
        this.ensureQdrantConfigured();
        this.validateEmbedding(dto.embedding);
        const matches = await this.faceRepository.searchFaceVector(dto.embedding);
        if (!matches.length) {
            throw new _common.UnauthorizedException('Face verification failed');
        }
        const bestMatch = matches[0];
        const matchUserId = bestMatch.payload?.user_id || bestMatch.id;
        if (String(matchUserId) !== String(userId)) {
            throw new _common.UnauthorizedException('Face verification failed');
        }
        if (bestMatch.score < this.similarityThreshold) {
            throw new _common.UnauthorizedException('Face verification failed');
        }
        return {
            message: 'Face verified successfully',
            similarity_score: Number(bestMatch.score.toFixed(4))
        };
    }
    ensureQdrantConfigured() {
        if (!this.configService.get('qdrant.url')) {
            throw new _common.ServiceUnavailableException('Face authentication requires Qdrant configuration');
        }
    }
    validateEmbedding(embedding) {
        if (embedding.length !== this.vectorSize) {
            throw new _common.BadRequestException(`Embedding must contain exactly ${this.vectorSize} values`);
        }
    }
    async buildAuthResponse(user, similarityScore) {
        const tokens = await this.generateTokens(user);
        return {
            user: this.sanitizeUser(user),
            similarity_score: Number(similarityScore.toFixed(4)),
            ...tokens
        };
    }
    sanitizeUser(user) {
        return {
            id: user.id,
            email: user.email,
            mobile: user.mobile,
            status: user.status,
            created_at: user.created_at,
            updated_at: user.updated_at
        };
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email
        };
        const accessToken = await this.jwtService.signAsync(payload);
        const refreshToken = (0, _crypto.randomUUID)();
        await this.redisService.setex(`${REFRESH_TOKEN_PREFIX}${refreshToken}`, this.refreshTtlSeconds, user.id);
        return {
            accessToken,
            refreshToken,
            expiresIn: this.configService.get('jwt.expiresIn')
        };
    }
};
FaceService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_facerepository.FaceRepository)),
    _ts_param(1, (0, _common.Inject)(_jwt.JwtService)),
    _ts_param(2, (0, _common.Inject)(_config.ConfigService)),
    _ts_param(3, (0, _common.Inject)(_redisservice.RedisService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0,
        void 0,
        void 0
    ])
], FaceService);

//# sourceMappingURL=face.service.js.map