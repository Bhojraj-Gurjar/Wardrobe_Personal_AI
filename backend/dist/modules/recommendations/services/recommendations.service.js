"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RecommendationsService", {
    enumerable: true,
    get: function() {
        return RecommendationsService;
    }
});
const _common = require("@nestjs/common");
const _apicacheservice = require("../../../common/services/api-cache.service");
const _qdrantservice = require("../../../database/qdrant.service");
const _aiservice = require("../../ai/services/ai.service");
const _recommendationsrepository = require("../repositories/recommendations.repository");
const _embeddingprovider = require("../providers/embedding.provider");
const _usercontextbuilder = require("./user-context.builder");
const _recommendationconstants = require("../validators/recommendation.constants");
const _productcatalogmapper = require("../../products/utils/product-catalog.mapper");
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
let RecommendationsService = class RecommendationsService {
    constructor(recommendationsRepository, qdrantService, embeddingProviderFactory, aiService, apiCacheService){
        this.recommendationsRepository = recommendationsRepository;
        this.qdrantService = qdrantService;
        this.embeddingProviderFactory = embeddingProviderFactory;
        this.aiService = aiService;
        this.apiCacheService = apiCacheService;
        this.logger = new _common.Logger(RecommendationsService.name);
    }
    async getRecommendations(userId, query) {
        const limit = query.limit || 12;
        const mode = query.type || 'default';
        const cacheKey = this.apiCacheService.buildKey('recommendations', userId, mode, query.event || 'none', limit);
        return this.apiCacheService.getOrSet(cacheKey, 300, async ()=>{
            const rawSignals = await this.recommendationsRepository.getUserSignals(userId);
            const signals = (0, _usercontextbuilder.buildUserSignals)(rawSignals);
            const factors = (0, _usercontextbuilder.buildFactorsSummary)(signals);
            let vectorResults = await this.searchWithQdrant(signals, limit * 2, userId);
            if (!vectorResults.length) {
                vectorResults = await this.searchWithPostgres(signals, limit * 2);
            }
            vectorResults = this.applyRecommendationMode(vectorResults, mode, query.event);
            vectorResults = this.deduplicateResults(vectorResults).slice(0, limit);
            return this.buildResponse(vectorResults, factors, limit, vectorResults.length ? _recommendationconstants.RECOMMENDATION_SOURCES.QDRANT : _recommendationconstants.RECOMMENDATION_SOURCES.POSTGRESQL, mode);
        });
    }
    applyRecommendationMode(items, mode, event) {
        if (!items.length) {
            return items;
        }
        const boosted = items.map((item)=>{
            let score = item.score;
            if (mode === 'daily') {
                score += 0.05;
            } else if (mode === 'seasonal') {
                const month = new Date().getMonth();
                const seasonalTags = month >= 3 && month <= 8 ? [
                    'summer',
                    'light',
                    'linen'
                ] : [
                    'winter',
                    'layer',
                    'warm'
                ];
                const tags = [
                    ...Array.isArray(item.product.style_tags) ? item.product.style_tags : [],
                    item.product.category,
                    item.product.subcategory
                ].filter(Boolean).map((tag)=>String(tag).toLowerCase());
                if (seasonalTags.some((tag)=>tags.some((value)=>value.includes(tag)))) {
                    score += 0.12;
                }
            } else if (mode === 'event' && event) {
                const eventTag = String(event).toLowerCase();
                const occasions = Array.isArray(item.product.occasion_tags) ? item.product.occasion_tags.map((tag)=>String(tag).toLowerCase()) : [];
                if (occasions.some((tag)=>tag.includes(eventTag))) {
                    score += 0.15;
                }
            } else if (mode === 'trending') {
                score += (item.product.review_count || 0) / 10000;
            }
            return {
                ...item,
                score
            };
        });
        return boosted.sort((left, right)=>right.score - left.score);
    }
    deduplicateResults(items) {
        const seen = new Set();
        return items.filter((item)=>{
            if (seen.has(item.product.id)) {
                return false;
            }
            seen.add(item.product.id);
            return true;
        });
    }
    async searchWithQdrant(signals, limit, userId) {
        if (!this.qdrantService.isConfigured()) {
            return [];
        }
        try {
            const provider = this.embeddingProviderFactory.getHeuristicProvider();
            let vector = provider.embedUserSignals(signals);
            if (this.aiService.isConfigured()) {
                try {
                    const aiResult = await this.aiService.generateRecommendations({
                        profile: signals.profile || signals,
                        user_id: userId
                    });
                    vector = aiResult.vector;
                } catch (error) {
                    this.logger.warn(`AI recommendation vector fallback: ${error.message}`);
                }
            }
            const matches = await this.qdrantService.searchSimilar(vector, limit);
            if (!matches.length) {
                return [];
            }
            const products = await this.recommendationsRepository.findProductsByIds(matches.map((match)=>match.id));
            const productMap = new Map(products.map((product)=>[
                    product.id,
                    product
                ]));
            return matches.map((match)=>{
                const product = productMap.get(match.id);
                if (!product) {
                    return null;
                }
                const { matchedFactors } = (0, _usercontextbuilder.scoreProduct)(product, signals);
                return {
                    product,
                    score: Number(match.score.toFixed(4)),
                    matched_factors: matchedFactors
                };
            }).filter(Boolean);
        } catch (error) {
            this.logger.warn(`Qdrant search failed, falling back to PostgreSQL: ${error.message}`);
            return [];
        }
    }
    async searchWithPostgres(signals, limit) {
        const candidates = await this.recommendationsRepository.findCandidateProducts(signals.wishlistProductIds, limit);
        return candidates.map((product)=>{
            const { score, matchedFactors } = (0, _usercontextbuilder.scoreProduct)(product, signals);
            return {
                product,
                score,
                matched_factors: matchedFactors
            };
        }).sort((left, right)=>right.score - left.score).slice(0, limit);
    }
    buildResponse(items, factors, limit, source, mode = 'default') {
        return {
            items: items.map((item)=>({
                    score: item.score,
                    matched_factors: item.matched_factors,
                    product: this.formatProduct(item.product)
                })),
            factors,
            meta: {
                total: items.length,
                limit,
                source,
                mode
            }
        };
    }
    formatProduct(product) {
        return (0, _productcatalogmapper.formatCatalogProduct)(product);
    }
    async indexProductForVectorSearch(product) {
        const provider = this.embeddingProviderFactory.getHeuristicProvider();
        const vector = provider.embedProduct(product);
        return this.qdrantService.upsertProductVector(product.id, vector, {
            product_id: product.id,
            sku: product.sku,
            brand: product.brand ?? product.brand_id,
            brand_id: product.brand_id ?? product.brand,
            category: product.category ?? product.category_id,
            category_id: product.category_id ?? product.category,
            subcategory: product.subcategory
        });
    }
};
RecommendationsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_recommendationsrepository.RecommendationsRepository)),
    _ts_param(1, (0, _common.Inject)(_qdrantservice.QdrantService)),
    _ts_param(2, (0, _common.Inject)(_embeddingprovider.EmbeddingProviderFactory)),
    _ts_param(3, (0, _common.Inject)(_aiservice.AiService)),
    _ts_param(4, (0, _common.Inject)(_apicacheservice.ApiCacheService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0,
        void 0,
        void 0,
        void 0
    ])
], RecommendationsService);

//# sourceMappingURL=recommendations.service.js.map