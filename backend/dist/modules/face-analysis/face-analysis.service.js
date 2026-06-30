"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FaceAnalysisService", {
    enumerable: true,
    get: function() {
        return FaceAnalysisService;
    }
});
const _common = require("@nestjs/common");
const _core = require("@nestjs/core");
const _faceanalysisrepository = require("./face-analysis.repository");
const _facebiometrictraitsservice = require("./services/face-biometric-traits.service");
const _faceanalysisvectorservice = require("./services/face-analysis-vector.service");
const _faceimagestorageservice = require("../face/services/face-image-storage.service");
const _aiservice = require("../ai/services/ai.service");
const _fashiondnaregenerationconstants = require("../fashion-dna/constants/fashion-dna-regeneration.constants");
const _fashiondnaregenerationservice = require("../fashion-dna/services/fashion-dna-regeneration.service");
const _pipelineeventbus = require("../user-pipeline/pipeline-event.bus");
const _notificationsservice = require("../notifications/notifications.service");
const _notificationsconstants = require("../notifications/notifications.constants");
const _faceanalysismapper = require("./utils/face-analysis.mapper");
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
function resolveFaceService(moduleRef) {
    const { FaceService } = require('../face/services/face.service');
    return moduleRef.get(FaceService, {
        strict: false
    });
}
let FaceAnalysisService = class FaceAnalysisService {
    constructor(faceAnalysisRepository, biometricTraitsService, faceAnalysisVectorService, faceImageStorageService, aiService, fashionDnaRegenerationService, pipelineEventBus, moduleRef, notificationsService){
        this.faceAnalysisRepository = faceAnalysisRepository;
        this.biometricTraitsService = biometricTraitsService;
        this.faceAnalysisVectorService = faceAnalysisVectorService;
        this.faceImageStorageService = faceImageStorageService;
        this.aiService = aiService;
        this.fashionDnaRegenerationService = fashionDnaRegenerationService;
        this.pipelineEventBus = pipelineEventBus;
        this.moduleRef = moduleRef;
        this.notificationsService = notificationsService;
        this.logger = new _common.Logger(FaceAnalysisService.name);
    }
    async collectBiometricTraits(userId) {
        return this.biometricTraitsService.collectBiometricTraits(userId);
    }
    async getStoredTraits(userId) {
        const record = await this.faceAnalysisRepository.findByUserId(userId);
        if (!record) {
            return null;
        }
        return (0, _faceanalysismapper.mapRecordToStoredTraits)(record);
    }
    async getMyFaceAnalysis(userId) {
        const record = await resolveUserArtifacts(this.moduleRef).ensureFaceAnalysis(userId);
        const facePhoto = await resolveFaceService(this.moduleRef).getFacePhoto(userId);
        return {
            ...record,
            face_image_url: facePhoto.face_image_url,
            faceImageUrl: facePhoto.faceImageUrl,
            is_face_registered: facePhoto.is_face_registered
        };
    }
    async analyzeFace(userId, imageDto) {
        if (!imageDto?.imageBuffer?.length) {
            throw new _common.BadRequestException('Provide a frontFace image upload.');
        }
        if (!this.aiService.isConfigured()) {
            throw new _common.ServiceUnavailableException('AI service unavailable.');
        }
        await resolveFaceService(this.moduleRef).replaceFacePhoto(userId, imageDto);
        return this.persistFaceTraitAnalysis(userId, imageDto);
    }
    async analyzeStoredFace(userId) {
        const facePhoto = await resolveFaceService(this.moduleRef).getFacePhoto(userId);
        if (!facePhoto.is_face_registered || !facePhoto.face_image_url) {
            throw new _common.BadRequestException('Register a face photo before running analysis.');
        }
        if (!this.aiService.isConfigured()) {
            throw new _common.ServiceUnavailableException('AI service unavailable.');
        }
        const storedImage = await this.faceImageStorageService.readFaceImage(facePhoto.face_image_url);
        if (!storedImage?.buffer?.length) {
            throw new _common.NotFoundException('Stored face photo could not be loaded.');
        }
        return this.persistFaceTraitAnalysis(userId, {
            imageBuffer: storedImage.buffer,
            imageMimeType: storedImage.mimeType
        });
    }
    async persistFaceTraitAnalysis(userId, imageDto) {
        let aiResponse;
        try {
            aiResponse = await this.aiService.analyzeFaceTraits(imageDto.imageBuffer, imageDto.imageMimeType);
        } catch (error) {
            this.logger.error(`Face trait analysis failed for user ${userId}: ${error.message}`);
            throw error;
        }
        const record = await this.faceAnalysisRepository.saveAnalysisFromAi(userId, aiResponse);
        await this.faceAnalysisVectorService.syncUserVector(userId, record);
        this.fashionDnaRegenerationService.trigger(userId, _fashiondnaregenerationconstants.REFRESH_SOURCES.FACE_ANALYSIS);
        setImmediate(()=>{
            this.pipelineEventBus.emit(_pipelineeventbus.PIPELINE_SIGNALS.FACE_ANALYSIS_COMPLETED, {
                userId
            });
        });
        this.notificationsService.notifyProfileEvent(userId, _notificationsconstants.APP_NOTIFICATION_TYPES.FACE_UPDATED, 'Face analysis completed', 'Your face analysis report is ready to view.', '/face-analysis').catch(()=>null);
        const facePhoto = await resolveFaceService(this.moduleRef).getFacePhoto(userId);
        return {
            ...(0, _faceanalysismapper.formatFaceAnalysisRecord)(record),
            face_image_url: facePhoto.face_image_url,
            faceImageUrl: facePhoto.faceImageUrl,
            is_face_registered: facePhoto.is_face_registered
        };
    }
    async updateFaceAnalysis(userId, dto) {
        const existing = await this.faceAnalysisRepository.findByUserId(userId);
        if (!existing) {
            throw new _common.NotFoundException('Face analysis not found. Run POST /face-analysis/analyze first.');
        }
        const extracted = (0, _faceanalysismapper.mapUpdateDtoToPersistence)(dto);
        if (!Object.keys(extracted).length) {
            throw new _common.BadRequestException('Provide at least one field to update');
        }
        const record = await this.faceAnalysisRepository.updateExtractedTraits(userId, dto, existing);
        await this.faceAnalysisVectorService.syncUserVector(userId, record);
        this.fashionDnaRegenerationService.trigger(userId, _fashiondnaregenerationconstants.REFRESH_SOURCES.FACE_ANALYSIS);
        return (0, _faceanalysismapper.formatFaceAnalysisRecord)(record);
    }
};
FaceAnalysisService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_faceanalysisrepository.FaceAnalysisRepository)),
    _ts_param(1, (0, _common.Inject)(_facebiometrictraitsservice.FaceBiometricTraitsService)),
    _ts_param(2, (0, _common.Inject)(_faceanalysisvectorservice.FaceAnalysisVectorService)),
    _ts_param(3, (0, _common.Inject)(_faceimagestorageservice.FaceImageStorageService)),
    _ts_param(4, (0, _common.Inject)(_aiservice.AiService)),
    _ts_param(5, (0, _common.Inject)((0, _common.forwardRef)(()=>_fashiondnaregenerationservice.FashionDnaRegenerationService))),
    _ts_param(6, (0, _common.Inject)(_pipelineeventbus.PipelineEventBus)),
    _ts_param(7, (0, _common.Inject)(_core.ModuleRef)),
    _ts_param(8, (0, _common.Inject)(_notificationsservice.NotificationsService)),
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
], FaceAnalysisService);

//# sourceMappingURL=face-analysis.service.js.map