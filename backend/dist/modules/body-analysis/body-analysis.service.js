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
const _core = require("@nestjs/core");
const _bodyanalysisrepository = require("./body-analysis.repository");
const _bodyanalysisvectorservice = require("./services/body-analysis-vector.service");
const _bodyimagestorageservice = require("./services/body-image-storage.service");
const _storagepathresolverservice = require("../../storage/services/storage-path-resolver.service");
const _aiservice = require("../ai/services/ai.service");
const _fashiondnaregenerationconstants = require("../fashion-dna/constants/fashion-dna-regeneration.constants");
const _fashiondnaregenerationservice = require("../fashion-dna/services/fashion-dna-regeneration.service");
const _pipelineeventbus = require("../user-pipeline/pipeline-event.bus");
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
    constructor(bodyAnalysisRepository, bodyAnalysisVectorService, bodyImageStorageService, storagePathResolver, aiService, fashionDnaRegenerationService, pipelineEventBus, moduleRef){
        this.bodyAnalysisRepository = bodyAnalysisRepository;
        this.bodyAnalysisVectorService = bodyAnalysisVectorService;
        this.bodyImageStorageService = bodyImageStorageService;
        this.storagePathResolver = storagePathResolver;
        this.aiService = aiService;
        this.fashionDnaRegenerationService = fashionDnaRegenerationService;
        this.pipelineEventBus = pipelineEventBus;
        this.moduleRef = moduleRef;
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
        if (record && !record.body_image_url) {
            const repairedPath = await this.bodyImageStorageService.findStoredBodyImagePath(userId);
            if (repairedPath) {
                this.logger.warn(`Repaired missing body_image_url for user ${userId} from stored file`);
                record = await this.bodyAnalysisRepository.saveBodyImagePath(userId, repairedPath);
            }
        }
        return this.formatBodyAnalysisResponse(record);
    }
    formatBodyAnalysisResponse(record) {
        if (!record) {
            return {
                bodyImageUrl: null,
                bodyPhotoUrl: null,
                body_image_url: null
            };
        }
        const bodyImagePath = record.body_image_url || null;
        const bodyImageUrl = this.storagePathResolver.toPublicUrl(bodyImagePath);
        return {
            ...(0, _bodyanalysismapper.formatBodyAnalysisRecord)(record),
            body_image_url: bodyImagePath,
            bodyImageUrl,
            bodyPhotoUrl: bodyImageUrl
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
        const bodyImagePath = await this.replaceBodyPhoto(userId, imageDto);
        if (bodyImagePath) {
            await this.bodyAnalysisRepository.saveBodyImagePath(userId, bodyImagePath);
        }
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
        return this.formatBodyAnalysisResponse(record);
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
            return this.formatBodyAnalysisResponse(existing);
        }
        const record = await this.bodyAnalysisRepository.saveOrUpdateExtractedTraits(userId, dto);
        if (!record) {
            return this.formatBodyAnalysisResponse(existing);
        }
        await this.bodyAnalysisVectorService.syncUserVector(userId, record);
        this.fashionDnaRegenerationService.trigger(userId, _fashiondnaregenerationconstants.REFRESH_SOURCES.BODY_ANALYSIS);
        return this.formatBodyAnalysisResponse(record);
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
                    bodyShapeCode: raw.bodyShapeCode ?? null
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
        return this.formatBodyAnalysisResponse(record);
    }
};
BodyAnalysisService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_bodyanalysisrepository.BodyAnalysisRepository)),
    _ts_param(1, (0, _common.Inject)(_bodyanalysisvectorservice.BodyAnalysisVectorService)),
    _ts_param(2, (0, _common.Inject)(_bodyimagestorageservice.BodyImageStorageService)),
    _ts_param(3, (0, _common.Inject)(_storagepathresolverservice.StoragePathResolver)),
    _ts_param(4, (0, _common.Inject)(_aiservice.AiService)),
    _ts_param(5, (0, _common.Inject)((0, _common.forwardRef)(()=>_fashiondnaregenerationservice.FashionDnaRegenerationService))),
    _ts_param(6, (0, _common.Inject)(_pipelineeventbus.PipelineEventBus)),
    _ts_param(7, (0, _common.Inject)(_core.ModuleRef)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
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