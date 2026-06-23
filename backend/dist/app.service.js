"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppService", {
    enumerable: true,
    get: function() {
        return AppService;
    }
});
const _common = require("@nestjs/common");
const _aiservice = require("./modules/ai/services/ai.service");
const _qdrantservice = require("./database/qdrant.service");
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
let AppService = class AppService {
    constructor(aiService, qdrantService){
        this.aiService = aiService;
        this.qdrantService = qdrantService;
    }
    getHealth() {
        return {
            status: 'ok',
            service: 'Wardrobe AI API',
            layer: 'nestjs'
        };
    }
    async getAiHealth() {
        return this.aiService.checkHealth();
    }
    async getQdrantHealth() {
        return this.qdrantService.checkHealth();
    }
    async getDiagnostics() {
        const nestjs = this.getHealth();
        const [fastapi, qdrant] = await Promise.all([
            this.getAiHealth(),
            this.getQdrantHealth()
        ]);
        const layers = {
            frontend: {
                status: 'unknown',
                note: 'Check browser console for [FaceUpload] logs'
            },
            nestjs,
            fastapi,
            qdrant
        };
        let failingLayer = null;
        if (fastapi.status !== 'ok') {
            failingLayer = 'nestjs_to_fastapi';
        } else if (qdrant.status !== 'ok') {
            failingLayer = 'nestjs_to_qdrant';
        }
        return {
            status: failingLayer ? 'degraded' : 'ok',
            layers,
            collection: qdrant.face_collection || null,
            environment: {
                AI_SERVICE_URL: fastapi.url,
                QDRANT_URL: qdrant.url,
                QDRANT_FACE_COLLECTION: qdrant.faceCollection,
                FACE_VECTOR_SIZE: qdrant.faceVectorSize
            },
            failing_layer: failingLayer
        };
    }
};
AppService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_aiservice.AiService)),
    _ts_param(1, (0, _common.Inject)(_qdrantservice.QdrantService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ])
], AppService);

//# sourceMappingURL=app.service.js.map