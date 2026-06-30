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
const _faceratelimitservice = require("./face-rate-limit.service");
const _storagepathresolverservice = require("../../../storage/services/storage-path-resolver.service");
const _redisservice = require("../../../database/redis.service");
const _aiservice = require("../../ai/services/ai.service");
const _fashiondnaregenerationconstants = require("../../fashion-dna/constants/fashion-dna-regeneration.constants");
const _fashiondnaregenerationservice = require("../../fashion-dna/services/fashion-dna-regeneration.service");
const _userpipelineservice = require("../../user-pipeline/user-pipeline.service");
const _usermediaregistryservice = require("../../user-media/services/user-media-registry.service");
const _notificationsservice = require("../../notifications/notifications.service");
const _notificationsconstants = require("../../notifications/notifications.constants");
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
    constructor(faceRepository, faceImageStorageService, faceRateLimitService, storagePathResolver, jwtService, configService, redisService, aiService, fashionDnaRegenerationService, userPipelineService, userMediaRegistryService, notificationsService){
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
        this.notificationsService = notificationsService;
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
        this.notificationsService.notifyProfileEvent(userId, _notificationsconstants.APP_NOTIFICATION_TYPES.FACE_REGISTERED, 'Face registration completed', 'Your face has been registered successfully.', '/face-analysis').catch(()=>null);
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
            const aiResult = await this.aiService.registerFace(userId, dto);
            const livenessMeta = {
                livenessScore: aiResult?.liveness_score ?? aiResult?.livenessScore ?? null,
                blinkDetected: dto.challengeType === 'blink_once' || dto.challengeType === 'blink_twice',
                smileDetected: dto.challengeType === 'smile'
            };
            const existing = await this.faceRepository.findFaceRegistration(userId);
            const faceImagePath = await this.faceImageStorageService.replaceFaceImage(userId, dto.imageBuffer, dto.imageMimeType, existing?.face_image_url);
            await this.userMediaRegistryService.registerFacePhoto(userId, faceImagePath, {
                mimeType: dto.imageMimeType,
                fileSize: dto.imageBuffer?.length,
                uploadSource: 'face_registration'
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
    async login(dto, context = {}) {
        if (!dto.imageBuffer?.length) {
            throw new _common.BadRequestException('Provide a frontFace image upload.');
        }
        if (!this.aiService.isConfigured()) {
            throw new _common.ServiceUnavailableException('AI service unavailable.');
        }
        const rateLimitKey = context.clientIp || 'anonymous';
        await this.faceRateLimitService.assertNotLocked('login', rateLimitKey);
        this.logFaceAudit('login_attempt', {
            clientIp: context.clientIp,
            userAgent: context.userAgent,
            captureSessionId: dto.captureSessionId,
            challengeType: dto.challengeType,
            frameCount: dto.livenessFrames?.length || 1
        });
        let result;
        try {
            result = await this.aiService.loginFace(dto);
        } catch (error) {
            if (error instanceof _common.UnauthorizedException || error instanceof _common.BadRequestException) {
                try {
                    await this.faceRateLimitService.recordFailure('login', rateLimitKey, {
                        reason: error.message,
                        challengeType: dto.challengeType
                    });
                } catch (lockError) {
                    if (lockError instanceof _common.TooManyRequestsException) {
                        throw lockError;
                    }
                }
            }
            this.logFaceAudit('login_failed', {
                clientIp: context.clientIp,
                reason: error.message,
                challengeType: dto.challengeType
            });
            this.rethrowAiError(error);
        }
        const user = await this.faceRepository.findUserById(result.user_id);
        if (!user) {
            await this.faceRateLimitService.recordFailure('login', rateLimitKey, {
                reason: 'user_not_found'
            });
            throw new _common.UnauthorizedException('Face not recognized.');
        }
        if (user.status !== _userstatus.USER_STATUS.ACTIVE) {
            throw new _common.ForbiddenException('Account is not active');
        }
        await this.faceRateLimitService.recordSuccess('login', rateLimitKey);
        this.logFaceAudit('login_success', {
            userId: user.id,
            clientIp: context.clientIp,
            challengeType: dto.challengeType
        });
        return this.buildAuthResponse(user, {
            similarityScore: result?.similarity_score ?? result?.similarityScore ?? null
        });
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
    async logout(userId, dto) {
        if (!dto.imageBuffer?.length) {
            throw new _common.BadRequestException('Face image is required.');
        }
        if (!this.aiService.isConfigured()) {
            throw new _common.ServiceUnavailableException('AI service unavailable.');
        }
        const registration = await this.faceRepository.findFaceRegistration(userId);
        if (!registration?.is_face_registered) {
            throw new _common.BadRequestException('Register a face before using face logout verification.');
        }
        let result;
        try {
            result = await this.aiService.logoutFace(userId, dto.imageBuffer, dto.imageMimeType);
        } catch (error) {
            this.rethrowAiError(error);
        }
        const logoutNonce = (0, _crypto.randomUUID)();
        await this.redisService.setex(`auth:logout-nonce:${userId}:${logoutNonce}`, 120, '1');
        return {
            verified: true,
            similarity_score: result?.similarity_score ?? result?.similarityScore ?? null,
            logoutNonce,
            message: 'Face verified for logout'
        };
    }
    rethrowAiError(error) {
        if (error instanceof _common.BadRequestException || error instanceof _common.UnauthorizedException || error instanceof _common.ConflictException || error instanceof _common.ServiceUnavailableException || error instanceof _common.TooManyRequestsException) {
            throw error;
        }
        throw new _common.ServiceUnavailableException('AI service unavailable.');
    }
    logFaceAudit(event, meta = {}) {
        this.logger.log(`FACE_AUDIT | event=${event} | ${JSON.stringify(meta)}`);
    }
    async buildAuthResponse(user, extra = {}) {
        const tokens = await this.generateTokens(user);
        return {
            user: this.sanitizeUser(user),
            faceVerified: true,
            message: 'Face verified',
            ...extra,
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
    _ts_param(2, (0, _common.Inject)(_faceratelimitservice.FaceRateLimitService)),
    _ts_param(3, (0, _common.Inject)(_storagepathresolverservice.StoragePathResolver)),
    _ts_param(4, (0, _common.Inject)(_jwt.JwtService)),
    _ts_param(5, (0, _common.Inject)(_config.ConfigService)),
    _ts_param(6, (0, _common.Inject)(_redisservice.RedisService)),
    _ts_param(7, (0, _common.Inject)(_aiservice.AiService)),
    _ts_param(8, (0, _common.Inject)(_fashiondnaregenerationservice.FashionDnaRegenerationService)),
    _ts_param(9, (0, _common.Inject)((0, _common.forwardRef)(()=>_userpipelineservice.UserPipelineService))),
    _ts_param(10, (0, _common.Inject)(_usermediaregistryservice.UserMediaRegistryService)),
    _ts_param(11, (0, _common.Inject)(_notificationsservice.NotificationsService)),
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
        void 0,
        void 0,
        void 0,
        void 0
    ])
], FaceService);

//# sourceMappingURL=face.service.js.map