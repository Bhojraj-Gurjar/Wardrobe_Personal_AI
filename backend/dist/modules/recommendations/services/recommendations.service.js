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
    constructor(recommendationsRepository, qdrantService, embeddingProviderFactory, aiService){
        this.recommendationsRepository = recommendationsRepository;
        this.qdrantService = qdrantService;
        this.embeddingProviderFactory = embeddingProviderFactory;
        this.aiService = aiService;
        this.logger = new _common.Logger(RecommendationsService.name);
    }
    async getRecommendations(userId, query) {
        const rawSignals = await this.recommendationsRepository.getUserSignals(userId);
        const signals = (0, _usercontextbuilder.buildUserSignals)(rawSignals);
        const factors = (0, _usercontextbuilder.buildFactorsSummary)(signals);
        const vectorResults = await this.searchWithQdrant(signals, query.limit, userId);
        if (vectorResults.length) {
            return this.buildResponse(vectorResults, factors, query.limit, _recommendationconstants.RECOMMENDATION_SOURCES.QDRANT);
        }
        const postgresResults = await this.searchWithPostgres(signals, query.limit);
        return this.buildResponse(postgresResults, factors, query.limit, _recommendationconstants.RECOMMENDATION_SOURCES.POSTGRESQL);
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
    buildResponse(items, factors, limit, source) {
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
                source
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
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0,
        void 0,
        void 0
    ])
], RecommendationsService);

//# sourceMappingURL=recommendations.service.js.map