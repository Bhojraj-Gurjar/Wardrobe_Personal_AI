"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyAnalysisService", {
    enumerable: true,
    get: function() {
        return BodyAnalysisService;
    }
});
const _common = require("@nestjs/common");
const _userimageguardutil = require("../../common/utils/user-image-guard.util");
const _core = require("@nestjs/core");
const _bodyanalysisrepository = require("./body-analysis.repository");
const _bodyanalysisvectorservice = require("./services/body-analysis-vector.service");
const _bodyimagestorageservice = require("./services/body-image-storage.service");
const _bodyphotoprocessingservice = require("./services/body-photo-processing.service");
const _bodyfitproductsservice = require("./services/body-fit-products.service");
const _bodyphotodisplayutil = require("./utils/body-photo-display.util");
const _storagepathresolverservice = require("../../storage/services/storage-path-resolver.service");
const _aiservice = require("../ai/services/ai.service");
const _fashiondnaregenerationconstants = require("../fashion-dna/constants/fashion-dna-regeneration.constants");
const _fashiondnaregenerationservice = require("../fashion-dna/services/fashion-dna-regeneration.service");
const _pipelineeventbus = require("../user-pipeline/pipeline-event.bus");
const _usermediaregistryservice = require("../user-media/services/user-media-registry.service");
const _notificationsservice = require("../notifications/notifications.service");
const _notificationsconstants = require("../notifications/notifications.constants");
const _bodyanalysismapper = require("./utils/body-analysis.mapper");
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
let BodyAnalysisService = class BodyAnalysisService {
    constructor(bodyAnalysisRepository, bodyAnalysisVectorService, bodyImageStorageService, bodyPhotoProcessingService, bodyFitProductsService, storagePathResolver, aiService, fashionDnaRegenerationService, pipelineEventBus, moduleRef, userMediaRegistryService, notificationsService){
        this.bodyAnalysisRepository = bodyAnalysisRepository;
        this.bodyAnalysisVectorService = bodyAnalysisVectorService;
        this.bodyImageStorageService = bodyImageStorageService;
        this.bodyPhotoProcessingService = bodyPhotoProcessingService;
        this.bodyFitProductsService = bodyFitProductsService;
        this.storagePathResolver = storagePathResolver;
        this.aiService = aiService;
        this.fashionDnaRegenerationService = fashionDnaRegenerationService;
        this.pipelineEventBus = pipelineEventBus;
        this.moduleRef = moduleRef;
        this.userMediaRegistryService = userMediaRegistryService;
        this.notificationsService = notificationsService;
        this.logger = new _common.Logger(BodyAnalysisService.name);
    }
    async getStoredTraits(userId) {
        const record = await this.bodyAnalysisRepository.findByUserId(userId);
        if (!record) {
            return null;
        }
        return (0, _bodyanalysismapper.mapRecordToStoredTraits)(record);
    }
    async getMyBodyAnalysis(userId) {
        await resolveUserArtifacts(this.moduleRef).ensureBodyAnalysis(userId);
        let record = await this.bodyAnalysisRepository.findByUserId(userId);
        const user = await this.bodyAnalysisRepository.findUserBodyImageContext(userId);
        const resolvedPath = await this.resolveCanonicalBodyImagePath(userId, record);
        if (resolvedPath && (!record || record.body_image_url !== resolvedPath)) {
            this.logger.log(`Linked stored onboarding body photo for user ${userId}`);
            record = await this.bodyAnalysisRepository.saveBodyImagePath(userId, resolvedPath);
        }
        return this.enrichBodyAnalysisResponse(record, user);
    }
    buildMeasurementsPayload(record) {
        return {
            height: record?.height ?? null,
            shoulderWidth: record?.shoulder_width ?? null,
            chest: record?.chest ?? null,
            waist: record?.waist ?? null,
            hip: record?.hip ?? null,
            armLength: record?.arm_length ?? null,
            legLength: record?.leg_length ?? null
        };
    }
    async resolveFitProfile(record) {
        const raw = record?.raw_ai_response || {};
        let fitProfile = record?.fit_profile;
        if (fitProfile?.schemaVersion === 2) {
            return fitProfile;
        }
        if (!record?.body_type || !record?.body_shape || !this.aiService.isConfigured()) {
            return fitProfile;
        }
        try {
            const fitResponse = await this.aiService.generateFitProfile({
                bodyType: record.body_type,
                bodyShape: record.body_shape,
                bodyTypeCode: raw.bodyTypeCode ?? null,
                bodyShapeCode: raw.bodyShapeCode ?? null,
                measurements: this.buildMeasurementsPayload(record),
                bodyTypeRatios: raw.bodyTypeRatios ?? null,
                bodyShapeRatios: raw.bodyShapeRatios ?? null,
                widthMeasurementsCm: raw.widthMeasurementsCm ?? null
            });
            return fitResponse?.fitProfile || fitProfile;
        } catch (error) {
            this.logger.warn(`Fit profile refresh failed: ${error.message}`);
            return fitProfile;
        }
    }
    async enrichBodyAnalysisResponse(record, context = {}) {
        if (!record) {
            return await this.formatBodyAnalysisResponse(record, context);
        }
        const formatted = await this.formatBodyAnalysisResponse(record, context);
        if (!formatted.hasAnalysis) {
            return formatted;
        }
        const fitProfile = await this.bodyFitProductsService.attachProductsToFitGuide(record, context?.profile || null, await this.resolveFitProfile(record));
        return {
            ...formatted,
            fitProfile
        };
    }
    async resolveExistingBodyImagePath(userId, record = null, context = null) {
        const user = context?.profile ? {
            profile: context.profile
        } : await this.bodyAnalysisRepository.findUserBodyImageContext(userId);
        const preferences = user?.profile?.preferences || {};
        const candidates = [];
        const pushCandidate = (value)=>{
            const sanitized = (0, _userimageguardutil.sanitizeBodyPhotoPath)(value);
            if (sanitized && !candidates.includes(sanitized)) {
                candidates.push(sanitized);
            }
        };
        pushCandidate(record?.body_image_url);
        const filesystemPath = await this.bodyImageStorageService.findStoredBodyImagePath(userId);
        pushCandidate(filesystemPath);
        pushCandidate(preferences.bodyPhoto);
        pushCandidate(preferences.body_photo);
        pushCandidate(preferences.onboardingBodyPhoto);
        pushCandidate(preferences.bodyPhotoOriginal);
        for (const candidate of candidates){
            if (await this.bodyImageStorageService.bodyImageExists(candidate)) {
                return candidate;
            }
        }
        return null;
    }
    async clearStaleBodyPhotoRefs(userId) {
        await this.bodyAnalysisRepository.clearBodyImageUrl(userId);
        const user = await this.bodyAnalysisRepository.findUserBodyImageContext(userId);
        if (!user?.profile) {
            return;
        }
        const preferences = {
            ...user.profile.preferences || {}
        };
        delete preferences.bodyPhoto;
        delete preferences.body_photo;
        delete preferences.onboardingBodyPhoto;
        delete preferences.bodyPhotoOriginal;
        delete preferences.bodyPhotoProcessed;
        delete preferences.transparentBodyPhoto;
        delete preferences.bodyPhotoProcessing;
        await this.bodyAnalysisRepository.updateProfileBodyImageRefs(userId, {
            body_image: null,
            preferences
        });
        this.bodyPhotoProcessingService.removeTransparentPng(userId);
        this.logger.warn(`Cleared stale body photo references for user ${userId}`);
    }
    async resolveCanonicalBodyImagePath(userId, record = null) {
        const user = await this.bodyAnalysisRepository.findUserBodyImageContext(userId);
        const resolved = await this.resolveExistingBodyImagePath(userId, record, {
            profile: user?.profile
        });
        if (resolved) {
            return resolved;
        }
        const hadStoredReference = Boolean((0, _userimageguardutil.sanitizeBodyPhotoPath)(record?.body_image_url) || (0, _userimageguardutil.sanitizeBodyPhotoPath)(user?.profile?.body_image) || (0, _userimageguardutil.sanitizeBodyPhotoPath)(user?.profile?.preferences?.bodyPhoto) || (0, _userimageguardutil.sanitizeBodyPhotoPath)(user?.profile?.preferences?.body_photo) || (0, _userimageguardutil.sanitizeBodyPhotoPath)(user?.profile?.preferences?.onboardingBodyPhoto));
        if (hadStoredReference) {
            await this.clearStaleBodyPhotoRefs(userId);
        }
        return null;
    }
    async syncBodyPhotoToProfile(userId, bodyImagePath) {
        const sanitized = (0, _userimageguardutil.sanitizeBodyPhotoPath)(bodyImagePath);
        if (!sanitized) {
            return;
        }
        const user = await this.bodyAnalysisRepository.findUserBodyImageContext(userId);
        if (!user?.profile) {
            return;
        }
        const preferences = {
            ...user.profile.preferences || {},
            bodyPhoto: sanitized
        };
        await this.bodyAnalysisRepository.updateProfileBodyImageRefs(userId, {
            body_image: sanitized,
            preferences
        });
    }
    async formatBodyAnalysisResponse(record, context = {}) {
        if (!record) {
            return {
                bodyImageUrl: null,
                bodyPhotoUrl: null,
                body_image_url: null,
                bodyPhotoOriginalUrl: null,
                bodyPhotoTransparentUrl: null,
                bodyPhotoProcessing: null,
                bodyPhotoMissing: false
            };
        }
        const preferences = context?.profile?.preferences || {};
        const userId = record.user_id;
        let originalPath = (0, _bodyphotodisplayutil.resolveOriginalBodyImagePath)(record, preferences);
        let bodyPhotoMissing = false;
        if (originalPath && !await this.bodyImageStorageService.bodyImageExists(originalPath)) {
            bodyPhotoMissing = true;
            await this.clearStaleBodyPhotoRefs(userId);
            originalPath = null;
        }
        let transparentPath = null;
        if (originalPath) {
            const transparentCandidate = (0, _bodyphotodisplayutil.resolveTransparentBodyImagePath)(userId, preferences);
            if (transparentCandidate && await this.bodyPhotoProcessingService.transparentPngExists(userId) && await this.bodyImageStorageService.bodyImageExists(transparentCandidate)) {
                transparentPath = transparentCandidate;
            }
        }
        const displayPath = transparentPath || originalPath;
        return {
            ...(0, _bodyanalysismapper.formatBodyAnalysisRecord)(record),
            body_image_url: originalPath,
            bodyImageUrl: displayPath ? this.storagePathResolver.toPublicUrl(displayPath) : null,
            bodyPhotoUrl: displayPath ? this.storagePathResolver.toPublicUrl(displayPath) : null,
            bodyPhotoOriginalUrl: originalPath ? this.storagePathResolver.toPublicUrl(originalPath) : null,
            bodyPhotoTransparentUrl: transparentPath ? this.storagePathResolver.toPublicUrl(transparentPath) : null,
            bodyPhotoProcessing: bodyPhotoMissing ? null : preferences.bodyPhotoProcessing || null,
            bodyPhotoMissing
        };
    }
    async replaceBodyPhoto(userId, imageDto) {
        if (!imageDto?.imageBuffer?.length) {
            return null;
        }
        const existing = await this.bodyAnalysisRepository.findByUserId(userId);
        return this.bodyImageStorageService.replaceBodyImage(userId, imageDto.imageBuffer, imageDto.imageMimeType, existing?.body_image_url);
    }
    async analyzeBody(userId, imageDto) {
        if (!imageDto?.imageBuffer?.length && !imageDto?.videoBuffer?.length) {
            throw new _common.BadRequestException('Provide an image and/or a walkaround video.');
        }
        if (!this.aiService.isConfigured()) {
            throw new _common.ServiceUnavailableException('AI service unavailable.');
        }
        const user = await this.bodyAnalysisRepository.findUserBodyImageContext(userId);
        const height = imageDto.height ?? user?.profile?.height ?? null;
        if (!height || height <= 0) {
            throw new _common.BadRequestException('Height is required to calibrate body measurements. Add your height in profile or onboarding.');
        }
        const bodyImagePath = await this.replaceBodyPhoto(userId, imageDto);
        if (bodyImagePath) {
            await this.bodyAnalysisRepository.saveBodyImagePath(userId, bodyImagePath);
            await this.syncBodyPhotoToProfile(userId, bodyImagePath);
            await this.bodyPhotoProcessingService.processAfterUpload(userId, bodyImagePath);
            await this.userMediaRegistryService.registerBodyPhoto(userId, bodyImagePath, {
                mimeType: imageDto.imageMimeType,
                fileSize: imageDto.imageBuffer?.length,
                uploadSource: 'body_analysis'
            });
        }
        return this.persistBodyTraitAnalysis(userId, {
            ...imageDto,
            height
        }, bodyImagePath);
    }
    async analyzeStoredBody(userId) {
        if (!this.aiService.isConfigured()) {
            throw new _common.ServiceUnavailableException('AI service unavailable.');
        }
        let record = await this.bodyAnalysisRepository.findByUserId(userId);
        const bodyImagePath = await this.resolveCanonicalBodyImagePath(userId, record);
        if (!bodyImagePath) {
            throw new _common.BadRequestException('Upload a body photo before running analysis.');
        }
        if (!record?.body_image_url || record.body_image_url !== bodyImagePath) {
            record = await this.bodyAnalysisRepository.saveBodyImagePath(userId, bodyImagePath);
            await this.syncBodyPhotoToProfile(userId, bodyImagePath);
        }
        const storedImage = await this.bodyImageStorageService.readBodyImage(bodyImagePath);
        if (!storedImage?.buffer?.length) {
            throw new _common.BadRequestException('Your saved body photo is no longer available. Upload a new photo to run analysis.');
        }
        const user = await this.bodyAnalysisRepository.findUserBodyImageContext(userId);
        const height = record?.height ?? user?.profile?.height ?? null;
        if (!height || height <= 0) {
            throw new _common.BadRequestException('Height is required to calibrate body measurements. Update your profile height first.');
        }
        return this.persistBodyTraitAnalysis(userId, {
            imageBuffer: storedImage.buffer,
            imageMimeType: storedImage.mimeType,
            height
        }, bodyImagePath);
    }
    async persistBodyTraitAnalysis(userId, imageDto, bodyImagePath = null) {
        let aiResponse;
        try {
            aiResponse = await this.aiService.analyzeBodyTraits({
                imageBuffer: imageDto.imageBuffer,
                imageMimeType: imageDto.imageMimeType,
                videoBuffer: imageDto.videoBuffer,
                videoMimeType: imageDto.videoMimeType,
                height: imageDto.height
            });
        } catch (error) {
            this.logger.error(`Body trait analysis failed for user ${userId}: ${error.message}`);
            throw error;
        }
        const record = await this.bodyAnalysisRepository.saveAnalysisFromAi(userId, aiResponse, bodyImagePath);
        await this.bodyAnalysisVectorService.syncUserVector(userId, record);
        this.fashionDnaRegenerationService.trigger(userId, _fashiondnaregenerationconstants.REFRESH_SOURCES.BODY_ANALYSIS);
        setImmediate(()=>{
            this.pipelineEventBus.emit(_pipelineeventbus.PIPELINE_SIGNALS.BODY_ANALYSIS_COMPLETED, {
                userId
            });
        });
        this.notificationsService.notifyProfileEvent(userId, _notificationsconstants.APP_NOTIFICATION_TYPES.BODY_ANALYSIS_COMPLETED, 'Body analysis completed', 'Your body analysis report is ready to view.', '/body-analysis').catch(()=>null);
        return this.enrichBodyAnalysisResponse(record);
    }
    async syncFromProfileUpdate(userId, profileDto) {
        const hasRelevantChange = [
            'height',
            'weight',
            'body_type'
        ].some((field)=>profileDto[field] !== undefined);
        if (!hasRelevantChange) {
            return null;
        }
        const existing = await this.bodyAnalysisRepository.findByUserId(userId);
        if (!existing) {
            return null;
        }
        const dto = {};
        if (profileDto.height !== undefined) {
            dto.height = profileDto.height;
        }
        if (!Object.keys(dto).length) {
            return await this.formatBodyAnalysisResponse(existing);
        }
        const record = await this.bodyAnalysisRepository.saveOrUpdateExtractedTraits(userId, dto);
        if (!record) {
            return await this.formatBodyAnalysisResponse(existing);
        }
        const heightChanged = profileDto.height !== undefined && profileDto.height !== existing.height;
        const bodyImagePath = await this.resolveCanonicalBodyImagePath(userId, record);
        if (heightChanged && bodyImagePath && this.aiService.isConfigured()) {
            try {
                return await this.analyzeStoredBody(userId);
            } catch (error) {
                this.logger.warn(`Body re-analysis after height change failed for user ${userId}: ${error.message}`);
            }
        }
        await this.bodyAnalysisVectorService.syncUserVector(userId, record);
        this.fashionDnaRegenerationService.trigger(userId, _fashiondnaregenerationconstants.REFRESH_SOURCES.BODY_ANALYSIS);
        return await this.formatBodyAnalysisResponse(record);
    }
    async updateBodyAnalysis(userId, dto) {
        const existing = await this.bodyAnalysisRepository.findByUserId(userId);
        const bodyType = dto.bodyType ?? existing?.body_type;
        const bodyShape = dto.bodyShape ?? existing?.body_shape;
        const shouldRefreshFitProfile = (dto.bodyType !== undefined || dto.bodyShape !== undefined) && bodyType && bodyShape;
        if (shouldRefreshFitProfile && this.aiService.isConfigured()) {
            try {
                const raw = existing?.raw_ai_response || {};
                const fitResponse = await this.aiService.generateFitProfile({
                    bodyType,
                    bodyShape,
                    bodyTypeCode: raw.bodyTypeCode ?? null,
                    bodyShapeCode: raw.bodyShapeCode ?? null,
                    measurements: this.buildMeasurementsPayload(existing),
                    bodyTypeRatios: raw.bodyTypeRatios ?? null,
                    bodyShapeRatios: raw.bodyShapeRatios ?? null,
                    widthMeasurementsCm: raw.widthMeasurementsCm ?? null
                });
                if (fitResponse?.fitProfile) {
                    dto.fitProfile = fitResponse.fitProfile;
                }
            } catch (error) {
                this.logger.warn(`Fit profile regeneration failed for user ${userId}: ${error.message}`);
            }
        }
        const record = await this.bodyAnalysisRepository.saveOrUpdateExtractedTraits(userId, dto);
        if (!record) {
            throw new _common.BadRequestException('Provide at least one field to update');
        }
        await this.bodyAnalysisVectorService.syncUserVector(userId, record);
        this.fashionDnaRegenerationService.trigger(userId, _fashiondnaregenerationconstants.REFRESH_SOURCES.BODY_ANALYSIS);
        return await this.formatBodyAnalysisResponse(record);
    }
};
BodyAnalysisService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_bodyanalysisrepository.BodyAnalysisRepository)),
    _ts_param(1, (0, _common.Inject)(_bodyanalysisvectorservice.BodyAnalysisVectorService)),
    _ts_param(2, (0, _common.Inject)(_bodyimagestorageservice.BodyImageStorageService)),
    _ts_param(3, (0, _common.Inject)(_bodyphotoprocessingservice.BodyPhotoProcessingService)),
    _ts_param(4, (0, _common.Inject)(_bodyfitproductsservice.BodyFitProductsService)),
    _ts_param(5, (0, _common.Inject)(_storagepathresolverservice.StoragePathResolver)),
    _ts_param(6, (0, _common.Inject)(_aiservice.AiService)),
    _ts_param(7, (0, _common.Inject)((0, _common.forwardRef)(()=>_fashiondnaregenerationservice.FashionDnaRegenerationService))),
    _ts_param(8, (0, _common.Inject)(_pipelineeventbus.PipelineEventBus)),
    _ts_param(9, (0, _common.Inject)(_core.ModuleRef)),
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
], BodyAnalysisService);

//# sourceMappingURL=body-analysis.service.js.map