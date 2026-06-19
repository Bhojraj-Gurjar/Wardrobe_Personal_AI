"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "QdrantService", {
    enumerable: true,
    get: function() {
        return QdrantService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _jsclientrest = require("@qdrant/js-client-rest");
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
let QdrantService = class QdrantService {
    constructor(configService){
        this.configService = configService;
        this.logger = new _common.Logger(QdrantService.name);
        this.collection = configService.get('qdrant.collection');
        this.vectorSize = configService.get('qdrant.vectorSize');
        this.client = this.createClient();
    }
    createClient() {
        const url = this.configService.get('qdrant.url');
        if (!url) {
            return null;
        }
        return new _jsclientrest.QdrantClient({
            url,
            apiKey: this.configService.get('qdrant.apiKey') || undefined,
            checkCompatibility: false
        });
    }
    isConfigured() {
        return Boolean(this.client);
    }
    async ensureCollection(collectionName, vectorSize) {
        if (!this.client) {
            return false;
        }
        const collections = await this.client.getCollections();
        const exists = collections.collections.some((item)=>item.name === collectionName);
        if (!exists) {
            await this.client.createCollection(collectionName, {
                vectors: {
                    size: vectorSize,
                    distance: 'Cosine'
                }
            });
        }
        return true;
    }
    async ensureDefaultCollection() {
        return this.ensureCollection(this.collection, this.vectorSize);
    }
    async searchSimilar(vector, limit = 10) {
        return this.searchInCollection(this.collection, vector, limit, this.vectorSize);
    }
    async searchInCollection(collectionName, vector, limit, vectorSize) {
        if (!this.client) {
            return [];
        }
        await this.ensureCollection(collectionName, vectorSize);
        const results = await this.client.search(collectionName, {
            vector,
            limit,
            with_payload: true
        });
        return results.map((point)=>({
                id: String(point.id),
                score: point.score,
                payload: point.payload || {}
            }));
    }
    async upsertProductVector(productId, vector, payload = {}) {
        return this.upsertVector(this.collection, productId, vector, {
            product_id: productId,
            ...payload
        }, this.vectorSize);
    }
    async upsertVector(collectionName, pointId, vector, payload, vectorSize) {
        if (!this.client) {
            return false;
        }
        await this.ensureCollection(collectionName, vectorSize);
        await this.client.upsert(collectionName, {
            wait: true,
            points: [
                {
                    id: pointId,
                    vector,
                    payload
                }
            ]
        });
        return true;
    }
    async deleteVector(collectionName, pointId) {
        if (!this.client) {
            return false;
        }
        await this.client.delete(collectionName, {
            wait: true,
            points: [
                pointId
            ]
        });
        return true;
    }
};
QdrantService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_config.ConfigService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], QdrantService);

//# sourceMappingURL=qdrant.service.js.map