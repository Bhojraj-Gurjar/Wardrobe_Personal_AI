"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HeuristicEmbeddingProvider", {
    enumerable: true,
    get: function() {
        return HeuristicEmbeddingProvider;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
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
let HeuristicEmbeddingProvider = class HeuristicEmbeddingProvider {
    constructor(configService){
        this.vectorSize = configService.get('qdrant.vectorSize');
    }
    isAvailable() {
        return true;
    }
    embedUserSignals(signals) {
        const vectors = [];
        if (signals.profile?.body_type) {
            vectors.push(this.featureVector('body_type', signals.profile.body_type));
        }
        if (signals.profile?.skin_tone) {
            vectors.push(this.featureVector('skin_tone', signals.profile.skin_tone));
        }
        signals.favoriteBrands.forEach((brandId)=>{
            vectors.push(this.featureVector('brand', brandId));
        });
        signals.favoriteColors.forEach((color)=>{
            vectors.push(this.weightedFeatureVector('color', color, 1));
        });
        signals.wishlistCategories.forEach((categoryId)=>{
            vectors.push(this.featureVector('category', categoryId));
        });
        if (signals.orderStats.count > 0) {
            vectors.push(this.weightedFeatureVector('shopping_history', 'active', Math.min(signals.orderStats.count / 10, 1)));
        }
        return this.mergeVectors(vectors);
    }
    embedProduct(product) {
        const vectors = [
            this.featureVector('product', product.id),
            this.featureVector('brand', product.brand_id),
            this.featureVector('category', product.category_id),
            this.weightedFeatureVector('price', product.sku, product.price / 1000)
        ];
        return this.mergeVectors(vectors);
    }
    featureVector(namespace, value) {
        return this.weightedFeatureVector(namespace, value, 1);
    }
    weightedFeatureVector(namespace, value, weight) {
        const vector = new Array(this.vectorSize).fill(0);
        const seed = `${namespace}:${value}`;
        for(let i = 0; i < seed.length; i += 1){
            const index = Math.abs(this.hash(seed, i)) % this.vectorSize;
            vector[index] += weight;
        }
        return vector;
    }
    hash(input, salt) {
        let hash = salt;
        for(let i = 0; i < input.length; i += 1){
            hash = (hash << 5) - hash + input.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }
    mergeVectors(vectors) {
        if (!vectors.length) {
            return new Array(this.vectorSize).fill(0);
        }
        const merged = new Array(this.vectorSize).fill(0);
        vectors.forEach((vector)=>{
            vector.forEach((value, index)=>{
                merged[index] += value;
            });
        });
        const magnitude = Math.sqrt(merged.reduce((sum, value)=>sum + value * value, 0));
        if (!magnitude) {
            return merged;
        }
        return merged.map((value)=>value / magnitude);
    }
};
HeuristicEmbeddingProvider = _ts_decorate([
    _ts_param(0, (0, _common.Inject)(_config.ConfigService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], HeuristicEmbeddingProvider);

//# sourceMappingURL=heuristic-embedding.provider.js.map