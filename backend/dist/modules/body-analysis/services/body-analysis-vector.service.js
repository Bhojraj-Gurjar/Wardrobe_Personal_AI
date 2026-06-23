"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyAnalysisVectorService", {
    enumerable: true,
    get: function() {
        return BodyAnalysisVectorService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _qdrantservice = require("../../../database/qdrant.service");
const _bodyanalysisembeddingutil = require("../utils/body-analysis-embedding.util");
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
let BodyAnalysisVectorService = class BodyAnalysisVectorService {
    constructor(qdrantService, configService){
        this.qdrantService = qdrantService;
        this.vectorSize = configService.get('bodyAnalysis.vectorSize');
        this.logger = new _common.Logger(BodyAnalysisVectorService.name);
    }
    buildPayload(userId, record) {
        const raw = record.raw_ai_response || {};
        return {
            bodyType: record.bodyType ?? record.body_type ?? null,
            bodyShape: record.bodyShape ?? record.body_shape ?? null,
            measurements: record.measurements ?? raw.measurements ?? null,
            fitProfile: record.fitProfile ?? record.fit_profile ?? null,
            updatedAt: new Date().toISOString()
        };
    }
    resolveVector(record) {
        if (Array.isArray(record.vector) && record.vector.length === this.vectorSize) {
            return record.vector;
        }
        const text = (0, _bodyanalysisembeddingutil.buildBodyAnalysisEmbeddingText)(record);
        return (0, _bodyanalysisembeddingutil.buildDeterministicBodyAnalysisVector)(text, this.vectorSize);
    }
    async syncUserVector(userId, record) {
        if (!userId || !record) {
            return null;
        }
        if (!this.qdrantService.isConfigured()) {
            this.logger.debug(`Qdrant not configured — skipping body analysis vector sync for user ${userId}`);
            return null;
        }
        const vector = this.resolveVector(record);
        const payload = this.buildPayload(userId, record);
        await this.qdrantService.upsertBodyAnalysisVector(userId, vector, payload);
        this.logger.log(`Body analysis vector synced | userId=${userId} | dimensions=${vector.length}`);
        return {
            userId,
            dimensions: vector.length,
            payload
        };
    }
    async getUserVector(userId) {
        if (!this.qdrantService.isConfigured()) {
            return null;
        }
        return this.qdrantService.getBodyAnalysisVector(userId);
    }
    async searchSimilarUsers(userId, limit = 10) {
        if (!this.qdrantService.isConfigured()) {
            return [];
        }
        const vector = await this.getUserVector(userId);
        if (!vector?.length) {
            return [];
        }
        return this.qdrantService.searchBodyAnalysisSimilar(vector, limit, {
            excludeUserId: userId
        });
    }
    async searchSimilarByVector(vector, limit = 10, options = {}) {
        if (!this.qdrantService.isConfigured() || !vector?.length) {
            return [];
        }
        return this.qdrantService.searchBodyAnalysisSimilar(vector, limit, options);
    }
};
BodyAnalysisVectorService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_qdrantservice.QdrantService)),
    _ts_param(1, (0, _common.Inject)(_config.ConfigService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ])
], BodyAnalysisVectorService);

//# sourceMappingURL=body-analysis-vector.service.js.map