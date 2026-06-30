"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsersService", {
    enumerable: true,
    get: function() {
        return UsersService;
    }
});
const _common = require("@nestjs/common");
const _userimageguardutil = require("../../../common/utils/user-image-guard.util");
const _apicacheservice = require("../../../common/services/api-cache.service");
const _fashiondnaregenerationconstants = require("../../fashion-dna/constants/fashion-dna-regeneration.constants");
const _fashiondnaregenerationservice = require("../../fashion-dna/services/fashion-dna-regeneration.service");
const _bodyanalysisservice = require("../../body-analysis/body-analysis.service");
const _bodyphotoprocessingservice = require("../../body-analysis/services/body-photo-processing.service");
const _bodyphotodisplayutil = require("../../body-analysis/utils/body-photo-display.util");
const _storagepathresolverservice = require("../../../storage/services/storage-path-resolver.service");
const _pipelineeventbus = require("../../user-pipeline/pipeline-event.bus");
const _notificationsservice = require("../../notifications/notifications.service");
const _notificationsconstants = require("../../notifications/notifications.constants");
const _userartifactsservice = require("../../user-artifacts/user-artifacts.service");
const _usermediaservice = require("../../user-media/services/user-media.service");
const _usermediaconstants = require("../../user-media/validators/user-media.constants");
const _usersrepository = require("../repositories/users.repository");
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
let UsersService = class UsersService {
    constructor(usersRepository, fashionDnaRegenerationService, bodyAnalysisService, pipelineEventBus, userArtifactsService, storagePathResolver, apiCacheService, bodyPhotoProcessingService, userMediaService, notificationsService){
        this.usersRepository = usersRepository;
        this.fashionDnaRegenerationService = fashionDnaRegenerationService;
        this.bodyAnalysisService = bodyAnalysisService;
        this.pipelineEventBus = pipelineEventBus;
        this.userArtifactsService = userArtifactsService;
        this.storagePathResolver = storagePathResolver;
        this.apiCacheService = apiCacheService;
        this.bodyPhotoProcessingService = bodyPhotoProcessingService;
        this.userMediaService = userMediaService;
        this.notificationsService = notificationsService;
    }
    profileCacheKey(userId) {
        return this.apiCacheService.buildKey('users:profile', userId);
    }
    async getProfile(userId) {
        return this.apiCacheService.getOrSet(this.profileCacheKey(userId), 120, async ()=>{
            const context = await this.usersRepository.findProfileContextByUserId(userId);
            if (!context?.profile) {
                throw new _common.NotFoundException('Profile not found');
            }
            return this.attachPersistentMediaUrls(userId, this.formatProfile(context.profile, context));
        });
    }
    async updateProfile(userId, dto) {
        const existingProfile = await this.ensureProfileExists(userId);
        const profileData = this.mapDtoToProfileData(dto);
        if (profileData.preferences !== undefined) {
            profileData.preferences = this.mergeProfilePreferences(existingProfile.preferences, profileData.preferences);
        }
        const profile = await this.usersRepository.updateProfileByUserId(userId, profileData);
        this.fashionDnaRegenerationService.trigger(userId, (0, _fashiondnaregenerationconstants.resolveProfileRegenerationSource)(dto));
        await this.bodyAnalysisService.syncFromProfileUpdate(userId, dto);
        setImmediate(()=>{
            this.pipelineEventBus.emit(_pipelineeventbus.PIPELINE_SIGNALS.PROFILE_UPDATED, {
                userId
            });
        });
        this.notificationsService.notifyProfileEvent(userId, _notificationsconstants.APP_NOTIFICATION_TYPES.PROFILE_UPDATED, 'Profile updated', 'Your profile changes have been saved.', '/profile').catch(()=>null);
        const context = await this.usersRepository.findProfileContextByUserId(userId);
        await this.apiCacheService.invalidate(this.profileCacheKey(userId));
        return this.attachPersistentMediaUrls(userId, this.formatProfile(profile, context));
    }
    async resolveMediaUrl(userId, storagePath, module) {
        if (storagePath) {
            const existing = await this.userMediaService.resolvePublicUrlIfExists(storagePath);
            if (existing) {
                return existing;
            }
        }
        const latest = await this.userMediaService.getLatestMedia(userId, module);
        return latest?.publicUrl || null;
    }
    async attachPersistentMediaUrls(userId, profile) {
        if (!profile) {
            return profile;
        }
        const faceImageUrl = await this.resolveMediaUrl(userId, profile.face_image_url, _usermediaconstants.USER_MEDIA_MODULE.FACE_REGISTRATION) || profile.faceImageUrl || null;
        const bodyPhotoOriginalUrl = await this.resolveMediaUrl(userId, profile.body_image_url || profile.body_image, _usermediaconstants.USER_MEDIA_MODULE.BODY_ANALYSIS) || profile.bodyPhotoOriginalUrl || null;
        const bodyPhotoUrl = bodyPhotoOriginalUrl || profile.bodyPhotoTransparentUrl || profile.bodyPhotoUrl || null;
        return {
            ...profile,
            faceImageUrl,
            bodyImageUrl: bodyPhotoUrl,
            bodyPhotoUrl,
            bodyPhotoOriginalUrl
        };
    }
    async ensureProfileExists(userId) {
        const profile = await this.usersRepository.findProfileByUserId(userId);
        if (!profile) {
            throw new _common.NotFoundException('Profile not found');
        }
        return profile;
    }
    mergeProfilePreferences(existing, patch) {
        const base = existing && typeof existing === 'object' && !Array.isArray(existing) ? {
            ...existing
        } : {};
        if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
            return base;
        }
        Object.entries(patch).forEach(([key, value])=>{
            if (value !== undefined && value !== null) {
                base[key] = value;
            }
        });
        return base;
    }
    mapDtoToProfileData(dto) {
        const data = {};
        if (dto.name !== undefined) {
            data.name = dto.name;
        }
        if (dto.gender !== undefined) {
            data.gender = dto.gender;
        }
        if (dto.age !== undefined) {
            data.age = dto.age;
        }
        if (dto.height !== undefined) {
            data.height = dto.height;
        }
        if (dto.weight !== undefined) {
            data.weight = dto.weight;
        }
        if (dto.country !== undefined) {
            data.country = dto.country;
        }
        if (dto.language !== undefined) {
            data.language = dto.language;
        }
        if (dto.body_type !== undefined) {
            data.body_type = dto.body_type;
        }
        if (dto.skin_tone !== undefined) {
            data.skin_tone = dto.skin_tone;
        }
        if (dto.preferences !== undefined) {
            data.preferences = dto.preferences;
        }
        return data;
    }
    formatProfile(profile, context = {}) {
        const faceImagePath = context.face_registration?.face_image_url || null;
        const preferences = profile.preferences || {};
        const userId = profile.user_id;
        const originalPath = (0, _bodyphotodisplayutil.resolveOriginalBodyImagePath)(context.body_analysis, preferences) || (0, _userimageguardutil.sanitizeBodyPhotoPath)(context.body_analysis?.body_image_url) || (0, _userimageguardutil.sanitizeBodyPhotoPath)(preferences.bodyPhoto) || (0, _userimageguardutil.sanitizeBodyPhotoPath)(preferences.body_photo) || (0, _userimageguardutil.sanitizeBodyPhotoPath)(profile.body_image) || null;
        const transparentCandidate = (0, _bodyphotodisplayutil.resolveTransparentBodyImagePath)(userId, preferences);
        const transparentPath = transparentCandidate && this.bodyPhotoProcessingService.transparentPngExists(userId) ? transparentCandidate : null;
        const displayPath = transparentPath || originalPath;
        return {
            id: profile.id,
            user_id: profile.user_id,
            name: profile.name,
            email: context.email || null,
            gender: profile.gender,
            age: profile.age,
            height: profile.height,
            weight: profile.weight,
            country: profile.country,
            language: profile.language,
            body_type: profile.body_type,
            skin_tone: profile.skin_tone,
            preferences: profile.preferences,
            is_face_registered: context.face_registration?.is_face_registered ?? false,
            face_image_url: faceImagePath,
            faceImageUrl: this.storagePathResolver.toPublicUrl(faceImagePath),
            body_image: originalPath,
            body_image_url: originalPath,
            bodyImageUrl: this.storagePathResolver.toPublicUrl(displayPath),
            bodyPhotoUrl: this.storagePathResolver.toPublicUrl(displayPath),
            bodyPhotoOriginalUrl: this.storagePathResolver.toPublicUrl(originalPath),
            bodyPhotoTransparentUrl: this.storagePathResolver.toPublicUrl(transparentPath),
            bodyPhotoProcessing: preferences.bodyPhotoProcessing || null,
            created_at: profile.created_at,
            updated_at: profile.updated_at
        };
    }
    ensureArtifacts(userId) {
        return this.userArtifactsService.ensureAllUserArtifacts(userId);
    }
};
UsersService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_usersrepository.UsersRepository)),
    _ts_param(1, (0, _common.Inject)(_fashiondnaregenerationservice.FashionDnaRegenerationService)),
    _ts_param(2, (0, _common.Inject)((0, _common.forwardRef)(()=>_bodyanalysisservice.BodyAnalysisService))),
    _ts_param(3, (0, _common.Inject)(_pipelineeventbus.PipelineEventBus)),
    _ts_param(4, (0, _common.Inject)(_userartifactsservice.UserArtifactsService)),
    _ts_param(5, (0, _common.Inject)(_storagepathresolverservice.StoragePathResolver)),
    _ts_param(6, (0, _common.Inject)(_apicacheservice.ApiCacheService)),
    _ts_param(7, (0, _common.Inject)(_bodyphotoprocessingservice.BodyPhotoProcessingService)),
    _ts_param(8, (0, _common.Inject)(_usermediaservice.UserMediaService)),
    _ts_param(9, (0, _common.Inject)(_notificationsservice.NotificationsService)),
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
        void 0
    ])
], UsersService);

//# sourceMappingURL=users.service.js.map