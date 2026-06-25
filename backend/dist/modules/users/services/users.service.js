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
const _apicacheservice = require("../../../common/services/api-cache.service");
const _fashiondnaregenerationconstants = require("../../fashion-dna/constants/fashion-dna-regeneration.constants");
const _fashiondnaregenerationservice = require("../../fashion-dna/services/fashion-dna-regeneration.service");
const _bodyanalysisservice = require("../../body-analysis/body-analysis.service");
const _storagepathresolverservice = require("../../../storage/services/storage-path-resolver.service");
const _pipelineeventbus = require("../../user-pipeline/pipeline-event.bus");
const _userartifactsservice = require("../../user-artifacts/user-artifacts.service");
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
    constructor(usersRepository, fashionDnaRegenerationService, bodyAnalysisService, pipelineEventBus, userArtifactsService, storagePathResolver, apiCacheService){
        this.usersRepository = usersRepository;
        this.fashionDnaRegenerationService = fashionDnaRegenerationService;
        this.bodyAnalysisService = bodyAnalysisService;
        this.pipelineEventBus = pipelineEventBus;
        this.userArtifactsService = userArtifactsService;
        this.storagePathResolver = storagePathResolver;
        this.apiCacheService = apiCacheService;
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
            return this.formatProfile(context.profile, context);
        });
    }
    async updateProfile(userId, dto) {
        await this.ensureProfileExists(userId);
        const profile = await this.usersRepository.updateProfileByUserId(userId, this.mapDtoToProfileData(dto));
        this.fashionDnaRegenerationService.trigger(userId, (0, _fashiondnaregenerationconstants.resolveProfileRegenerationSource)(dto));
        await this.bodyAnalysisService.syncFromProfileUpdate(userId, dto);
        setImmediate(()=>{
            this.pipelineEventBus.emit(_pipelineeventbus.PIPELINE_SIGNALS.PROFILE_UPDATED, {
                userId
            });
        });
        const context = await this.usersRepository.findProfileContextByUserId(userId);
        await this.apiCacheService.invalidate(this.profileCacheKey(userId));
        return this.formatProfile(profile, context);
    }
    async ensureProfileExists(userId) {
        const profile = await this.usersRepository.findProfileByUserId(userId);
        if (!profile) {
            throw new _common.NotFoundException('Profile not found');
        }
        return profile;
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
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
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