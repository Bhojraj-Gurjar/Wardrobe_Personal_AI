"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DigitalAvatarService", {
    enumerable: true,
    get: function() {
        return DigitalAvatarService;
    }
});
const _common = require("@nestjs/common");
const _core = require("@nestjs/core");
const _bodyanalysisservice = require("../body-analysis/body-analysis.service");
const _faceanalysisservice = require("../face-analysis/face-analysis.service");
const _usersrepository = require("../users/repositories/users.repository");
const _usermediaregistryservice = require("../user-media/services/user-media-registry.service");
const _aiservice = require("../ai/services/ai.service");
const _notificationsservice = require("../notifications/notifications.service");
const _notificationsconstants = require("../notifications/notifications.constants");
const _storagepathresolverservice = require("../../storage/services/storage-path-resolver.service");
const _digitalavatarcontextutil = require("./utils/digital-avatar-context.util");
const _digitalavatarrepository = require("./digital-avatar.repository");
const _avatarimagestorageservice = require("./services/avatar-image-storage.service");
const _digitalavatarvectorservice = require("./services/digital-avatar-vector.service");
const _avatargenerationpayloadutil = require("./utils/avatar-generation-payload.util");
const _digitalavatarmapper = require("./utils/digital-avatar.mapper");
const _avatartypeutil = require("./utils/avatar-type.util");
const _avatargenerationstrategyregistry = require("./strategies/avatar-generation-strategy.registry");
const _digitalavatarconstants = require("./constants/digital-avatar.constants");
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
function resolveUserArtifacts(moduleRef) {
    const { UserArtifactsService } = require('../user-artifacts/user-artifacts.service');
    return moduleRef.get(UserArtifactsService, {
        strict: false
    });
}
let DigitalAvatarService = class DigitalAvatarService {
    constructor(digitalAvatarRepository, avatarImageStorageService, storagePathResolver, aiService, faceAnalysisService, bodyAnalysisService, usersRepository, digitalAvatarVectorService, moduleRef, userMediaRegistryService, notificationsService){
        this.digitalAvatarRepository = digitalAvatarRepository;
        this.avatarImageStorageService = avatarImageStorageService;
        this.storagePathResolver = storagePathResolver;
        this.aiService = aiService;
        this.faceAnalysisService = faceAnalysisService;
        this.bodyAnalysisService = bodyAnalysisService;
        this.usersRepository = usersRepository;
        this.digitalAvatarVectorService = digitalAvatarVectorService;
        this.moduleRef = moduleRef;
        this.userMediaRegistryService = userMediaRegistryService;
        this.notificationsService = notificationsService;
        this.logger = new _common.Logger(DigitalAvatarService.name);
    }
    async syncAvatarVector(userId, record) {
        try {
            await this.digitalAvatarVectorService.syncUserVector(userId, record);
        } catch (error) {
            this.logger.warn(`Digital avatar vector sync failed for user ${userId}: ${error.message}`);
        }
    }
    formatRecord(record) {
        return (0, _digitalavatarmapper.formatDigitalAvatarRecord)(record, this.storagePathResolver.toPublicUrl.bind(this.storagePathResolver));
    }
    formatHistory(records) {
        return (0, _digitalavatarmapper.formatDigitalAvatarHistoryList)(records, this.storagePathResolver.toPublicUrl.bind(this.storagePathResolver));
    }
    async collectGenerationContext(userId) {
        const [profile, faceTraits, storedBodyTraits] = await Promise.all([
            this.usersRepository.findProfileByUserId(userId),
            this.faceAnalysisService.getStoredTraits(userId),
            this.bodyAnalysisService.getStoredTraits(userId)
        ]);
        let enrichedFaceTraits = faceTraits;
        let enrichedBodyTraits = storedBodyTraits;
        try {
            const fullFace = await this.faceAnalysisService.getMyFaceAnalysis(userId);
            enrichedFaceTraits = (0, _digitalavatarcontextutil.enrichFaceTraits)(faceTraits, fullFace);
        } catch  {
            enrichedFaceTraits = faceTraits;
        }
        try {
            const fullBody = await this.bodyAnalysisService.getMyBodyAnalysis(userId);
            enrichedBodyTraits = (0, _digitalavatarcontextutil.enrichBodyTraits)(storedBodyTraits, fullBody, profile);
        } catch  {
            enrichedBodyTraits = (0, _digitalavatarcontextutil.enrichBodyTraits)(storedBodyTraits, null, profile);
        }
        return {
            profile: (0, _digitalavatarcontextutil.buildProfileContext)(profile),
            faceTraits: enrichedFaceTraits,
            bodyTraits: enrichedBodyTraits
        };
    }
    hasGenerationTraits(context, avatarType = _digitalavatarconstants.DEFAULT_AVATAR_TYPE) {
        const requirement = (0, _avatartypeutil.getAvatarTraitRequirement)(avatarType);
        if (requirement === _avatartypeutil.AvatarTraitRequirement.DIGITAL_TWIN) {
            return (0, _digitalavatarcontextutil.hasDigitalTwin3DTraits)(context);
        }
        if (requirement === _avatartypeutil.AvatarTraitRequirement.PREMIUM) {
            return (0, _digitalavatarcontextutil.hasPremiumAvatarTraits)(context);
        }
        return (0, _digitalavatarcontextutil.hasBasicAvatarTraits)(context);
    }
    validateGenerationTraits(context, avatarType) {
        const requirement = (0, _avatartypeutil.getAvatarTraitRequirement)(avatarType);
        if (!this.hasGenerationTraits(context, avatarType)) {
            if (requirement === _avatartypeutil.AvatarTraitRequirement.DIGITAL_TWIN) {
                throw new _common.BadRequestException('3D Digital Twin requires complete face, body, skin tone, hair, and beard analysis.');
            }
            if (requirement === _avatartypeutil.AvatarTraitRequirement.PREMIUM) {
                throw new _common.BadRequestException('Premium avatar requires face analysis, body analysis, skin tone, hair analysis, and beard analysis.');
            }
            throw new _common.BadRequestException('Complete your profile, face analysis, and/or body analysis before generating an avatar.');
        }
    }
    assertAvatarTypeSupported(avatarType) {
        const strategy = (0, _avatargenerationstrategyregistry.resolveAvatarGenerationStrategy)(avatarType);
        if (!strategy.capabilities) {
            throw new _common.BadRequestException(`Unsupported avatar type: ${avatarType}`);
        }
        if (!strategy.capabilities.implemented) {
            throw new _common.HttpException('3D Digital Twin generation is not available yet.', _common.HttpStatus.NOT_IMPLEMENTED);
        }
        return strategy;
    }
    async resolveNextVersion(userId) {
        const latest = await this.digitalAvatarRepository.getLatestVersion(userId);
        const nextVersion = (latest?.version || 0) + 1;
        const duplicate = await this.digitalAvatarRepository.findByUserIdAndVersion(userId, nextVersion);
        if (duplicate) {
            throw new _common.BadRequestException(`Avatar version ${nextVersion} already exists. Retry the operation.`);
        }
        return nextVersion;
    }
    async persistGeneratedAvatar(userId, aiResponse, avatarType) {
        const canonicalType = (0, _avatartypeutil.normalizeAvatarType)(aiResponse.avatarType || avatarType);
        const nextVersion = await this.resolveNextVersion(userId);
        const { storagePath, rawAiResponse } = await this.avatarImageStorageService.persistAvatarGeneration(userId, nextVersion, aiResponse);
        const record = await this.digitalAvatarRepository.createAndActivateAvatar(userId, {
            user_id: userId,
            avatar_type: canonicalType,
            avatar_image: storagePath,
            version: nextVersion,
            raw_ai_response: rawAiResponse
        });
        await this.userMediaRegistryService.registerAvatar(userId, storagePath, {
            mimeType: 'image/png',
            metadata: {
                avatarType: canonicalType,
                version: nextVersion
            }
        });
        this.logger.log(`Digital avatar v${record.version} (${record.avatar_type}) activated for user ${userId}`);
        await this.syncAvatarVector(userId, record);
        this.notificationsService.notifyProfileEvent(userId, _notificationsconstants.APP_NOTIFICATION_TYPES.DIGITAL_AVATAR_GENERATED, 'Digital avatar generated', 'Your digital avatar is ready to view.', '/digital-avatar').catch(()=>null);
        return this.formatRecord(record);
    }
    async generateBasicAvatar(userId) {
        return this.generateAvatar(userId, {
            avatarType: _digitalavatarconstants.BASIC_AVATAR_TYPE
        });
    }
    async generatePremiumAvatar(userId) {
        return this.generateAvatar(userId, {
            avatarType: _digitalavatarconstants.PREMIUM_AVATAR_TYPE
        });
    }
    async generateDigitalTwinAvatar(userId) {
        return this.generateAvatar(userId, {
            avatarType: _digitalavatarconstants.DIGITAL_TWIN_3D_AVATAR_TYPE
        });
    }
    async getMyAvatar(userId) {
        return resolveUserArtifacts(this.moduleRef).ensureDigitalAvatar(userId);
    }
    async getAvatarHistory(userId) {
        const records = await this.digitalAvatarRepository.findHistoryByUserId(userId);
        return this.formatHistory(records);
    }
    async createVersionFromSource(userId, sourceRecord, updates) {
        const nextVersion = await this.resolveNextVersion(userId);
        const storagePath = await this.avatarImageStorageService.persistAvatarUpdate(userId, nextVersion, updates.avatarImage, sourceRecord.avatar_image);
        const record = await this.digitalAvatarRepository.createAndActivateAvatar(userId, {
            user_id: userId,
            avatar_type: (0, _avatartypeutil.normalizeAvatarType)(updates.avatarType ?? sourceRecord.avatar_type),
            avatar_image: storagePath,
            version: nextVersion,
            raw_ai_response: sourceRecord.raw_ai_response
        });
        this.logger.log(`Digital avatar v${record.version} (${record.avatar_type}) created from update for user ${userId}`);
        await this.syncAvatarVector(userId, record);
        return this.formatRecord(record);
    }
    async activateAvatarById(userId, avatarId) {
        const ownedAvatar = await this.digitalAvatarRepository.findByIdAndUserId(userId, avatarId);
        if (!ownedAvatar) {
            const existingAvatar = await this.digitalAvatarRepository.findById(avatarId);
            if (existingAvatar) {
                throw new _common.ForbiddenException('You cannot activate another user\'s avatar.');
            }
            throw new _common.NotFoundException('Digital avatar not found');
        }
        if (ownedAvatar.is_active) {
            return this.formatRecord(ownedAvatar);
        }
        const activated = await this.digitalAvatarRepository.activateAvatar(userId, avatarId);
        if (!activated) {
            throw new _common.NotFoundException('Digital avatar not found');
        }
        this.logger.log(`Digital avatar ${avatarId} (v${activated.version}) activated for user ${userId}`);
        await this.syncAvatarVector(userId, activated);
        return this.formatRecord(activated);
    }
    async generateAvatar(userId, dto = {}) {
        if (!this.aiService.isConfigured()) {
            throw new _common.ServiceUnavailableException('AI service unavailable.');
        }
        const context = await this.collectGenerationContext(userId);
        const strategy = this.assertAvatarTypeSupported(dto.avatarType || _digitalavatarconstants.DEFAULT_AVATAR_TYPE);
        const avatarType = strategy.canonicalType;
        this.validateGenerationTraits(context, avatarType);
        let aiResponse;
        try {
            aiResponse = await this.aiService.generateAvatar((0, _avatargenerationpayloadutil.buildAvatarGenerationPayload)(context, strategy.aiAvatarType));
        } catch (error) {
            this.logger.error(`Digital avatar generation failed for user ${userId}: ${error.message}`);
            throw error;
        }
        return this.persistGeneratedAvatar(userId, aiResponse, avatarType);
    }
    async updateAvatar(userId, dto) {
        const hasContentUpdate = dto.avatarType !== undefined || dto.avatarImage !== undefined;
        const hasActivation = dto.isActive === true;
        if (!hasContentUpdate && !hasActivation) {
            throw new _common.BadRequestException('Provide at least one field to update');
        }
        if (hasActivation && !hasContentUpdate) {
            if (!dto.avatarId) {
                throw new _common.BadRequestException('Provide avatarId to activate a historical avatar version');
            }
            return this.activateAvatarById(userId, dto.avatarId);
        }
        let sourceRecord = null;
        if (dto.avatarId) {
            sourceRecord = await this.digitalAvatarRepository.findByIdAndUserId(userId, dto.avatarId);
        }
        if (!sourceRecord) {
            sourceRecord = await this.digitalAvatarRepository.findActiveByUserId(userId);
        }
        if (!sourceRecord) {
            throw new _common.NotFoundException('No digital avatar found. Run POST /digital-avatar/generate first.');
        }
        return this.createVersionFromSource(userId, sourceRecord, dto);
    }
};
DigitalAvatarService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_digitalavatarrepository.DigitalAvatarRepository)),
    _ts_param(1, (0, _common.Inject)(_avatarimagestorageservice.AvatarImageStorageService)),
    _ts_param(2, (0, _common.Inject)(_storagepathresolverservice.StoragePathResolver)),
    _ts_param(3, (0, _common.Inject)(_aiservice.AiService)),
    _ts_param(4, (0, _common.Inject)(_faceanalysisservice.FaceAnalysisService)),
    _ts_param(5, (0, _common.Inject)(_bodyanalysisservice.BodyAnalysisService)),
    _ts_param(6, (0, _common.Inject)(_usersrepository.UsersRepository)),
    _ts_param(7, (0, _common.Inject)(_digitalavatarvectorservice.DigitalAvatarVectorService)),
    _ts_param(8, (0, _common.Inject)(_core.ModuleRef)),
    _ts_param(9, (0, _common.Inject)(_usermediaregistryservice.UserMediaRegistryService)),
    _ts_param(10, (0, _common.Inject)(_notificationsservice.NotificationsService)),
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
        void 0
    ])
], DigitalAvatarService);

//# sourceMappingURL=digital-avatar.service.js.map