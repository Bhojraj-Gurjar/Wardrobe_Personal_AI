"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UserPipelineService", {
    enumerable: true,
    get: function() {
        return UserPipelineService;
    }
});
const _common = require("@nestjs/common");
const _core = require("@nestjs/core");
const _prismaservice = require("../../database/prisma.service");
const _pipelineeventsconstants = require("./constants/pipeline-events.constants");
const _pipelineeventbus = require("./pipeline-event.bus");
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
let UserPipelineService = class UserPipelineService {
    constructor(pipelineEventBus, moduleRef, prisma){
        this.pipelineEventBus = pipelineEventBus;
        this.moduleRef = moduleRef;
        this.prisma = prisma;
        this.logger = new _common.Logger(UserPipelineService.name);
    }
    onModuleInit() {
        this.pipelineEventBus.on(_pipelineeventbus.PIPELINE_SIGNALS.FACE_ANALYSIS_COMPLETED, ({ userId })=>this.onFaceAnalysisCompleted(userId));
        this.pipelineEventBus.on(_pipelineeventbus.PIPELINE_SIGNALS.BODY_ANALYSIS_COMPLETED, ({ userId })=>this.onBodyAnalysisCompleted(userId));
        this.pipelineEventBus.on(_pipelineeventbus.PIPELINE_SIGNALS.PROFILE_UPDATED, ({ userId })=>this.onProfileUpdated(userId));
    }
    getFaceAnalysisService() {
        const { FaceAnalysisService } = require('../face-analysis/face-analysis.service');
        return this.moduleRef.get(FaceAnalysisService, {
            strict: false
        });
    }
    getDigitalAvatarService() {
        const { DigitalAvatarService } = require('../digital-avatar/digital-avatar.service');
        return this.moduleRef.get(DigitalAvatarService, {
            strict: false
        });
    }
    getFashionDnaService() {
        const { FashionDnaService } = require('../fashion-dna/services/fashion-dna.service');
        return this.moduleRef.get(FashionDnaService, {
            strict: false
        });
    }
    logEvent(event, userId, details = '') {
        const suffix = details ? ` | ${details}` : '';
        this.logger.log(`${event} | userId=${userId}${suffix}`);
    }
    onUserCreated(userId) {
        this.logEvent(_pipelineeventsconstants.PIPELINE_EVENTS.USER_CREATED, userId);
    }
    onFaceRegistered(userId, imageDto) {
        this.logEvent(_pipelineeventsconstants.PIPELINE_EVENTS.FACE_REGISTERED, userId);
        setImmediate(()=>{
            this.runFaceAnalysis(userId, imageDto).catch((error)=>{
                this.logger.warn(`Face analysis auto-trigger failed for user ${userId}: ${error.message}`);
            });
        });
    }
    async runFaceAnalysis(userId, imageDto) {
        if (!imageDto?.imageBuffer?.length) {
            return null;
        }
        const faceAnalysisService = this.getFaceAnalysisService();
        await faceAnalysisService.analyzeFace(userId, imageDto);
        return true;
    }
    async onFaceAnalysisCompleted(userId) {
        this.logEvent(_pipelineeventsconstants.PIPELINE_EVENTS.FACE_ANALYSIS_COMPLETED, userId);
        await this.tryGenerateAvatar(userId);
        await this.tryGenerateFashionDna(userId);
    }
    async onBodyAnalysisCompleted(userId) {
        this.logEvent(_pipelineeventsconstants.PIPELINE_EVENTS.BODY_ANALYSIS_COMPLETED, userId);
        await this.tryGenerateAvatar(userId);
        await this.tryGenerateFashionDna(userId);
    }
    async onProfileUpdated(userId) {
        await this.tryGenerateFashionDna(userId);
    }
    async shouldGenerateAvatar(userId) {
        const [face, body, activeAvatar] = await Promise.all([
            this.prisma.faceAnalysis.findUnique({
                where: {
                    user_id: userId
                }
            }),
            this.prisma.bodyAnalysis.findUnique({
                where: {
                    user_id: userId
                }
            }),
            this.prisma.digitalAvatar.findFirst({
                where: {
                    user_id: userId,
                    is_active: true
                },
                orderBy: {
                    version: 'desc'
                }
            })
        ]);
        if (!face || !body) {
            return false;
        }
        if (!activeAvatar) {
            return true;
        }
        const faceUpdatedAt = new Date(face.updated_at).getTime();
        const bodyUpdatedAt = new Date(body.updated_at).getTime();
        const avatarUpdatedAt = new Date(activeAvatar.updated_at).getTime();
        return faceUpdatedAt > avatarUpdatedAt || bodyUpdatedAt > avatarUpdatedAt;
    }
    async tryGenerateAvatar(userId) {
        try {
            const shouldGenerate = await this.shouldGenerateAvatar(userId);
            if (!shouldGenerate) {
                return null;
            }
            const digitalAvatarService = this.getDigitalAvatarService();
            await digitalAvatarService.generateBasicAvatar(userId);
            this.logEvent(_pipelineeventsconstants.PIPELINE_EVENTS.AVATAR_GENERATED, userId);
            return true;
        } catch (error) {
            this.logger.warn(`Avatar auto-generation failed for user ${userId}: ${error.message}`);
            return null;
        }
    }
    async tryGenerateFashionDna(userId) {
        try {
            const fashionDnaService = this.getFashionDnaService();
            const result = await fashionDnaService.generateFashionDnaIfReady(userId);
            if (result) {
                this.logEvent(_pipelineeventsconstants.PIPELINE_EVENTS.FASHION_DNA_GENERATED, userId);
            }
            return result;
        } catch (error) {
            this.logger.warn(`Fashion DNA auto-generation failed for user ${userId}: ${error.message}`);
            return null;
        }
    }
};
UserPipelineService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_pipelineeventbus.PipelineEventBus)),
    _ts_param(1, (0, _common.Inject)(_core.ModuleRef)),
    _ts_param(2, (0, _common.Inject)(_prismaservice.PrismaService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0,
        void 0
    ])
], UserPipelineService);

//# sourceMappingURL=user-pipeline.service.js.map