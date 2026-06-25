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
const _faceimagestorageservice = require("./face-image-storage.service");
const _storagepathresolverservice = require("../../../storage/services/storage-path-resolver.service");
const _redisservice = require("../../../database/redis.service");
const _aiservice = require("../../ai/services/ai.service");
const _fashiondnaregenerationconstants = require("../../fashion-dna/constants/fashion-dna-regeneration.constants");
const _fashiondnaregenerationservice = require("../../fashion-dna/services/fashion-dna-regeneration.service");
const _userpipelineservice = require("../../user-pipeline/user-pipeline.service");
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
    constructor(faceRepository, faceImageStorageService, storagePathResolver, jwtService, configService, redisService, aiService, fashionDnaRegenerationService, userPipelineService){
        this.faceRepository = faceRepository;
        this.faceImageStorageService = faceImageStorageService;
        this.storagePathResolver = storagePathResolver;
        this.jwtService = jwtService;
        this.configService = configService;
        this.redisService = redisService;
        this.aiService = aiService;
        this.fashionDnaRegenerationService = fashionDnaRegenerationService;
        this.userPipelineService = userPipelineService;
        this.logger = new _common.Logger(FaceService.name);
        this.refreshTtlSeconds = (0, _parseduration.parseDurationToSeconds)(configService.get('jwt.refreshExpiresIn'));
    }
    async register(userId, dto) {
        this.logger.log(`STEP 5 NestJS → FastAPI | path=/face/register | userId=${userId}`);
        const registration = await this.replaceFacePhoto(userId, dto);
        this.logger.log(`STEP 8 registration completed | userId=${userId}`);
        this.userPipelineService.onFaceRegistered(userId, {
            imageBuffer: dto.imageBuffer,
            imageMimeType: dto.imageMimeType
        });
        this.fashionDnaRegenerationService.trigger(userId, _fashiondnaregenerationconstants.REFRESH_SOURCES.FACE_ANALYSIS);
        return this.formatRegistrationResponse(userId, registration);
    }
    async updatePhoto(userId, dto) {
        const existing = await this.faceRepository.findFaceRegistration(userId);
        if (!existing?.is_face_registered) {
            throw new _common.BadRequestException('Register a face before changing your photo.');
        }
        const registration = await this.replaceFacePhoto(userId, dto);
        this.userPipelineService.onFaceRegistered(userId, {
            imageBuffer: dto.imageBuffer,
            imageMimeType: dto.imageMimeType
        });
        this.fashionDnaRegenerationService.trigger(userId, _fashiondnaregenerationconstants.REFRESH_SOURCES.FACE_ANALYSIS);
        return {
            ...this.formatRegistrationResponse(userId, registration),
            message: 'Face photo updated successfully'
        };
    }
    async replaceFacePhoto(userId, dto) {
        if (!dto.imageBuffer?.length) {
            throw new _common.BadRequestException('Provide a frontFace image upload.');
        }
        if (!this.aiService.isConfigured()) {
            throw new _common.ServiceUnavailableException('AI service unavailable.');
        }
        const staleCleanup = await this.faceRepository.purgeStaleFaceVectors();
        if (staleCleanup.deleted > 0) {
            this.logger.warn(`Removed ${staleCleanup.deleted} stale face vector(s) referencing deleted users`);
        }
        try {
            await this.aiService.registerFace(userId, dto.imageBuffer, dto.imageMimeType);
        } catch (error) {
            this.rethrowAiError(error);
        }
        const existing = await this.faceRepository.findFaceRegistration(userId);
        const faceImagePath = await this.faceImageStorageService.replaceFaceImage(userId, dto.imageBuffer, dto.imageMimeType, existing?.face_image_url);
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
            updated_at: registration?.updated_at
        };
    }
    async getFacePhoto(userId) {
        const registration = await this.faceRepository.findFaceRegistration(userId);
        if (!registration?.is_face_registered) {
            return {
                is_face_registered: false,
                face_image_url: null,
                faceImageUrl: null
            };
        }
        return {
            is_face_registered: true,
            face_image_url: registration.face_image_url,
            faceImageUrl: this.storagePathResolver.toPublicUrl(registration.face_image_url),
            registered_at: registration.registered_at,
            updated_at: registration.updated_at
        };
    }
    async login(dto) {
        if (!dto.imageBuffer?.length) {
            throw new _common.BadRequestException('Provide a frontFace image upload.');
        }
        if (!this.aiService.isConfigured()) {
            throw new _common.ServiceUnavailableException('AI service unavailable.');
        }
        let result;
        try {
            result = await this.aiService.loginFace(dto.imageBuffer, dto.imageMimeType);
        } catch (error) {
            this.rethrowAiError(error);
        }
        const user = await this.faceRepository.findUserById(result.user_id);
        if (!user) {
            throw new _common.UnauthorizedException('Face not recognized.');
        }
        if (user.status !== _userstatus.USER_STATUS.ACTIVE) {
            throw new _common.ForbiddenException('Account is not active');
        }
        return this.buildAuthResponse(user, result.similarity_score);
    }
    async verify(userId, dto) {
        if (!dto.imageBuffer?.length) {
            throw new _common.BadRequestException('Face image is required.');
        }
        if (!this.aiService.isConfigured()) {
            throw new _common.ServiceUnavailableException('AI service unavailable.');
        }
        try {
            return await this.aiService.verifyFace(userId, dto.imageBuffer, dto.imageMimeType);
        } catch (error) {
            this.rethrowAiError(error);
        }
    }
    rethrowAiError(error) {
        if (error instanceof _common.BadRequestException || error instanceof _common.UnauthorizedException || error instanceof _common.ConflictException || error instanceof _common.ServiceUnavailableException) {
            throw error;
        }
        throw new _common.ServiceUnavailableException('AI service unavailable.');
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
            role: user.role || 'USER',
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
    _ts_param(1, (0, _common.Inject)(_faceimagestorageservice.FaceImageStorageService)),
    _ts_param(2, (0, _common.Inject)(_storagepathresolverservice.StoragePathResolver)),
    _ts_param(3, (0, _common.Inject)(_jwt.JwtService)),
    _ts_param(4, (0, _common.Inject)(_config.ConfigService)),
    _ts_param(5, (0, _common.Inject)(_redisservice.RedisService)),
    _ts_param(6, (0, _common.Inject)(_aiservice.AiService)),
    _ts_param(7, (0, _common.Inject)(_fashiondnaregenerationservice.FashionDnaRegenerationService)),
    _ts_param(8, (0, _common.Inject)((0, _common.forwardRef)(()=>_userpipelineservice.UserPipelineService))),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0
    ])
], FaceService);

//# sourceMappingURL=face.service.js.map