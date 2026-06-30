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
        this.fashionDnaCollection = configService.get('fashionDna.collection');
        this.fashionDnaVectorSize = configService.get('fashionDna.vectorSize');
        this.faceAnalysisCollection = configService.get('faceAnalysis.collection');
        this.faceAnalysisVectorSize = configService.get('faceAnalysis.vectorSize');
        this.bodyAnalysisCollection = configService.get('bodyAnalysis.collection');
        this.bodyAnalysisVectorSize = configService.get('bodyAnalysis.vectorSize');
        this.digitalAvatarCollection = configService.get('digitalAvatar.collection');
        this.digitalAvatarVectorSize = configService.get('digitalAvatar.vectorSize');
        this.client = this.createClient();
    }
    async onModuleInit() {
        if (!this.client) {
            this.logger.warn('QDRANT_URL is not configured — vector features disabled');
            return;
        }
        try {
            const faceCollection = this.configService.get('face.collection');
            const faceVectorSize = this.configService.get('face.vectorSize');
            await this.ensureCollection(faceCollection, faceVectorSize);
            await this.ensureDefaultCollection();
            await this.ensureCollection(this.fashionDnaCollection, this.fashionDnaVectorSize);
            await this.ensureCollection(this.faceAnalysisCollection, this.faceAnalysisVectorSize);
            await this.ensureCollection(this.bodyAnalysisCollection, this.bodyAnalysisVectorSize);
            await this.ensureCollection(this.digitalAvatarCollection, this.digitalAvatarVectorSize);
            this.logger.log(`Qdrant collections ready (face: ${faceCollection}, products: ${this.collection}, fashion_dna: ${this.fashionDnaCollection}, face_analysis: ${this.faceAnalysisCollection}, body_analysis: ${this.bodyAnalysisCollection}, digital_avatar: ${this.digitalAvatarCollection})`);
        } catch (error) {
            this.logger.warn(`Qdrant bootstrap failed: ${error.message}`);
        }
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
    getConfigSummary() {
        return {
            url: this.configService.get('qdrant.url') || null,
            faceCollection: this.configService.get('face.collection'),
            faceVectorSize: this.configService.get('face.vectorSize'),
            productCollection: this.collection,
            productVectorSize: this.vectorSize,
            fashionDnaCollection: this.fashionDnaCollection,
            fashionDnaVectorSize: this.fashionDnaVectorSize,
            faceAnalysisCollection: this.faceAnalysisCollection,
            faceAnalysisVectorSize: this.faceAnalysisVectorSize,
            bodyAnalysisCollection: this.bodyAnalysisCollection,
            bodyAnalysisVectorSize: this.bodyAnalysisVectorSize,
            digitalAvatarCollection: this.digitalAvatarCollection,
            digitalAvatarVectorSize: this.digitalAvatarVectorSize
        };
    }
    mapQdrantError(error) {
        return this.mapConnectionError(error);
    }
    mapConnectionError(error) {
        const code = error?.cause?.code || error?.code || '';
        const message = error?.message || 'Unknown Qdrant error';
        const body = error?.data?.status?.error || error?.response?.data?.status?.error || '';
        if (code === 'ECONNREFUSED' || message.includes('ECONNREFUSED')) {
            return 'Qdrant is not running (connection refused). Start Docker: docker compose up -d qdrant';
        }
        if (message.includes('fetch failed') || message.includes('ENOTFOUND')) {
            return `Cannot reach Qdrant at ${this.configService.get('qdrant.url')}`;
        }
        if (message.includes('Bad Request') || /vector dimension|dimension/i.test(String(body))) {
            return `Qdrant vector dimension mismatch — collection expects a different size than the ${this.configService.get('face.vectorSize')}-dim embedding. Restart backend to recreate the collection.`;
        }
        return body || message;
    }
    async getCollectionVectorSize(collectionName) {
        const info = await this.client.getCollection(collectionName);
        const vectors = info.config?.params?.vectors;
        if (!vectors) {
            return null;
        }
        if (typeof vectors.size === 'number') {
            return vectors.size;
        }
        const named = Object.values(vectors)[0];
        return named?.size ?? null;
    }
    async ensureCollection(collectionName, vectorSize) {
        if (!this.client) {
            return false;
        }
        const collections = await this.client.getCollections();
        let exists = collections.collections.some((item)=>item.name === collectionName);
        if (exists) {
            const currentSize = await this.getCollectionVectorSize(collectionName);
            if (currentSize !== null && currentSize !== vectorSize) {
                this.logger.warn(`Qdrant collection "${collectionName}" has vector size ${currentSize}, expected ${vectorSize}. Recreating collection.`);
                await this.client.deleteCollection(collectionName);
                exists = false;
            }
        }
        if (!exists) {
            this.logger.log(`Creating Qdrant collection "${collectionName}" (${vectorSize} dimensions)`);
            await this.client.createCollection(collectionName, {
                vectors: {
                    size: vectorSize,
                    distance: 'Cosine'
                }
            });
        }
        return true;
    }
    async checkHealth() {
        const config = this.getConfigSummary();
        if (!this.client) {
            return {
                status: 'error',
                configured: false,
                message: 'QDRANT_URL is not configured',
                ...config
            };
        }
        try {
            const response = await this.client.getCollections();
            const names = response.collections.map((item)=>item.name);
            const faceExists = names.includes(config.faceCollection);
            await this.ensureCollection(config.faceCollection, config.faceVectorSize);
            return {
                status: 'ok',
                configured: true,
                reachable: true,
                collections: names,
                face_collection: {
                    name: config.faceCollection,
                    exists: true,
                    vector_size: config.faceVectorSize,
                    actual_vector_size: await this.getCollectionVectorSize(config.faceCollection).catch(()=>null)
                },
                ...config
            };
        } catch (error) {
            return {
                status: 'error',
                configured: true,
                reachable: false,
                message: this.mapConnectionError(error),
                ...config
            };
        }
    }
    async ensureDefaultCollection() {
        return this.ensureCollection(this.collection, this.vectorSize);
    }
    async collectionExists(collectionName) {
        if (!this.client) {
            return false;
        }
        const collections = await this.client.getCollections();
        return collections.collections.some((item)=>item.name === collectionName);
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
    async upsertFashionDnaVector(userId, vector, payload = {}) {
        return this.upsertVector(this.fashionDnaCollection, userId, vector, {
            user_id: userId,
            ...payload
        }, this.fashionDnaVectorSize);
    }
    async searchFashionDnaSimilar(vector, limit = 10, options = {}) {
        if (!this.client) {
            return [];
        }
        await this.ensureCollection(this.fashionDnaCollection, this.fashionDnaVectorSize);
        const searchParams = {
            vector,
            limit,
            with_payload: true
        };
        if (options.excludeUserId) {
            searchParams.filter = {
                must_not: [
                    {
                        key: 'user_id',
                        match: {
                            value: options.excludeUserId
                        }
                    }
                ]
            };
        }
        const results = await this.client.search(this.fashionDnaCollection, searchParams);
        return results.map((point)=>({
                id: String(point.id),
                userId: point.payload?.user_id || String(point.id),
                score: point.score,
                payload: point.payload || {}
            }));
    }
    async getFashionDnaVector(userId) {
        return this.getVector(this.fashionDnaCollection, userId);
    }
    async upsertFaceAnalysisVector(userId, vector, payload = {}) {
        return this.upsertVector(this.faceAnalysisCollection, userId, vector, {
            user_id: userId,
            ...payload
        }, this.faceAnalysisVectorSize);
    }
    async searchFaceAnalysisSimilar(vector, limit = 10, options = {}) {
        if (!this.client) {
            return [];
        }
        await this.ensureCollection(this.faceAnalysisCollection, this.faceAnalysisVectorSize);
        const searchParams = {
            vector,
            limit,
            with_payload: true
        };
        if (options.excludeUserId) {
            searchParams.filter = {
                must_not: [
                    {
                        key: 'user_id',
                        match: {
                            value: options.excludeUserId
                        }
                    }
                ]
            };
        }
        const results = await this.client.search(this.faceAnalysisCollection, searchParams);
        return results.map((point)=>({
                id: String(point.id),
                userId: point.payload?.user_id || String(point.id),
                score: point.score,
                payload: point.payload || {}
            }));
    }
    async getFaceAnalysisVector(userId) {
        return this.getVector(this.faceAnalysisCollection, userId);
    }
    async upsertBodyAnalysisVector(userId, vector, payload = {}) {
        return this.upsertVector(this.bodyAnalysisCollection, userId, vector, {
            user_id: userId,
            ...payload
        }, this.bodyAnalysisVectorSize);
    }
    async searchBodyAnalysisSimilar(vector, limit = 10, options = {}) {
        if (!this.client) {
            return [];
        }
        await this.ensureCollection(this.bodyAnalysisCollection, this.bodyAnalysisVectorSize);
        const searchParams = {
            vector,
            limit,
            with_payload: true
        };
        if (options.excludeUserId) {
            searchParams.filter = {
                must_not: [
                    {
                        key: 'user_id',
                        match: {
                            value: options.excludeUserId
                        }
                    }
                ]
            };
        }
        const results = await this.client.search(this.bodyAnalysisCollection, searchParams);
        return results.map((point)=>({
                id: String(point.id),
                userId: point.payload?.user_id || String(point.id),
                score: point.score,
                payload: point.payload || {}
            }));
    }
    async getBodyAnalysisVector(userId) {
        return this.getVector(this.bodyAnalysisCollection, userId);
    }
    async upsertDigitalAvatarVector(userId, vector, payload = {}) {
        return this.upsertVector(this.digitalAvatarCollection, userId, vector, {
            userId,
            user_id: userId,
            ...payload
        }, this.digitalAvatarVectorSize);
    }
    async searchDigitalAvatarSimilar(vector, limit = 10, options = {}) {
        if (!this.client) {
            return [];
        }
        await this.ensureCollection(this.digitalAvatarCollection, this.digitalAvatarVectorSize);
        const searchParams = {
            vector,
            limit,
            with_payload: true
        };
        if (options.excludeUserId) {
            searchParams.filter = {
                must_not: [
                    {
                        key: 'userId',
                        match: {
                            value: options.excludeUserId
                        }
                    }
                ]
            };
        }
        const results = await this.client.search(this.digitalAvatarCollection, searchParams);
        return results.map((point)=>({
                id: String(point.id),
                userId: point.payload?.userId || point.payload?.user_id || String(point.id),
                score: point.score,
                payload: point.payload || {}
            }));
    }
    async getDigitalAvatarVector(userId) {
        return this.getVector(this.digitalAvatarCollection, userId);
    }
    async upsertProductVector(productId, vector, payload = {}) {
        return this.upsertVector(this.collection, productId, vector, {
            product_id: productId,
            ...payload
        }, this.vectorSize);
    }
    async upsertVector(collectionName, pointId, vector, payload, vectorSize) {
        if (!this.client) {
            throw new Error('Qdrant client is not configured');
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
    async scrollCollection(collectionName, limit = 100, offset = undefined) {
        if (!this.client) {
            return {
                points: [],
                nextOffset: null
            };
        }
        const result = await this.client.scroll(collectionName, {
            limit,
            offset,
            with_payload: true,
            with_vector: false
        });
        return {
            points: result.points || [],
            nextOffset: result.next_page_offset ?? null
        };
    }
    async getVector(collectionName, pointId) {
        if (!this.client) {
            return null;
        }
        const points = await this.client.retrieve(collectionName, {
            ids: [
                pointId
            ],
            with_vector: true
        });
        return points[0]?.vector || null;
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