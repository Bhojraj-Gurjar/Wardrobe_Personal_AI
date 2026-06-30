"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FashionDnaVectorService", {
    enumerable: true,
    get: function() {
        return FashionDnaVectorService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _qdrantservice = require("../../../database/qdrant.service");
const _fashiondnaembeddingutil = require("../utils/fashion-dna-embedding.util");
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
let FashionDnaVectorService = class FashionDnaVectorService {
    constructor(qdrantService, configService){
        this.qdrantService = qdrantService;
        this.vectorSize = configService.get('fashionDna.vectorSize');
        this.logger = new _common.Logger(FashionDnaVectorService.name);
    }
    buildPayload(userId, record) {
        const colorAffinity = record.colorAffinity || record.color_affinity || {};
        const brandAffinity = record.brandAffinity || record.brand_affinity || {};
        const preferenceTraits = record.preferenceTraits || record.preference_traits || {};
        const activityTraits = record.activityTraits || record.activity_traits || {};
        const categoryAffinity = record.categoryAffinity || preferenceTraits.category_affinity || {};
        return {
            styleType: record.styleType || record.style_type || null,
            fashionPersonality: record.fashionPersonality || preferenceTraits.fashion_personality || activityTraits.fashionPersonality || null,
            colors: Object.keys(colorAffinity),
            topColors: activityTraits.topColors || [],
            colorAffinity,
            colorAffinityScore: activityTraits.colorAffinityScore ?? 0,
            brands: Object.keys(brandAffinity),
            brandAffinity,
            categories: Object.keys(categoryAffinity),
            categoryAffinity,
            budgetRange: record.budgetRange || record.budget_range || null,
            fashionConfidenceScore: record.fashionConfidenceScore ?? record.fashion_confidence_score ?? 0,
            updatedAt: new Date().toISOString()
        };
    }
    resolveVector(record) {
        if (Array.isArray(record.vector) && record.vector.length === this.vectorSize) {
            return record.vector;
        }
        const text = (0, _fashiondnaembeddingutil.buildFashionDnaEmbeddingText)(record);
        return (0, _fashiondnaembeddingutil.buildDeterministicFashionDnaVector)(text, this.vectorSize);
    }
    async syncUserVector(userId, record) {
        if (!userId || !record) {
            return null;
        }
        if (!this.qdrantService.isConfigured()) {
            this.logger.debug(`Qdrant not configured — skipping Fashion DNA vector sync for user ${userId}`);
            return null;
        }
        const vector = this.resolveVector(record);
        const payload = this.buildPayload(userId, record);
        await this.qdrantService.upsertFashionDnaVector(userId, vector, payload);
        this.logger.log(`Fashion DNA vector synced | userId=${userId} | dimensions=${vector.length}`);
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
        return this.qdrantService.getFashionDnaVector(userId);
    }
    async searchSimilarUsers(userId, limit = 10) {
        if (!this.qdrantService.isConfigured()) {
            return [];
        }
        const vector = await this.getUserVector(userId);
        if (!vector?.length) {
            return [];
        }
        return this.qdrantService.searchFashionDnaSimilar(vector, limit, {
            excludeUserId: userId
        });
    }
    async searchSimilarByVector(vector, limit = 10, options = {}) {
        if (!this.qdrantService.isConfigured() || !vector?.length) {
            return [];
        }
        return this.qdrantService.searchFashionDnaSimilar(vector, limit, options);
    }
};
FashionDnaVectorService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_qdrantservice.QdrantService)),
    _ts_param(1, (0, _common.Inject)(_config.ConfigService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ])
], FashionDnaVectorService);

//# sourceMappingURL=fashion-dna-vector.service.js.map