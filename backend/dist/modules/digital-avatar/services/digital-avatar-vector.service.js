"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DigitalAvatarVectorService", {
    enumerable: true,
    get: function() {
        return DigitalAvatarVectorService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _qdrantservice = require("../../../database/qdrant.service");
const _fashiondnarepository = require("../../fashion-dna/repositories/fashion-dna.repository");
const _digitalavatarembeddingutil = require("../utils/digital-avatar-embedding.util");
const _avatartypeutil = require("../utils/avatar-type.util");
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
let DigitalAvatarVectorService = class DigitalAvatarVectorService {
    constructor(qdrantService, configService, fashionDnaRepository){
        this.qdrantService = qdrantService;
        this.fashionDnaRepository = fashionDnaRepository;
        this.vectorSize = configService.get('digitalAvatar.vectorSize');
        this.logger = new _common.Logger(DigitalAvatarVectorService.name);
    }
    resolveTraitsFromAvatarRecord(record) {
        const raw = record.raw_ai_response || {};
        const metadata = raw.metadata || raw;
        const faceAnalysis = metadata.faceAnalysis || {};
        const bodyAnalysis = metadata.bodyAnalysis || {};
        const hairAnalysis = metadata.hairAnalysis || {};
        return {
            avatarType: record.avatar_type || record.avatarType || metadata.avatarType || raw.avatarType || null,
            bodyType: bodyAnalysis.bodyType || metadata.bodyType || record.bodyType || null,
            faceShape: faceAnalysis.faceShape || metadata.faceShape || record.faceShape || null,
            skinTone: metadata.skinTone || faceAnalysis.skinTone || record.skinTone || null,
            hairStyle: hairAnalysis.hairStyle || metadata.hairStyle || record.hairStyle || null
        };
    }
    buildPayload(userId, record, fashionDNA) {
        const traits = this.resolveTraitsFromAvatarRecord(record);
        return {
            userId,
            avatarType: (0, _avatartypeutil.normalizeAvatarType)(traits.avatarType),
            bodyType: traits.bodyType,
            faceShape: traits.faceShape,
            skinTone: traits.skinTone,
            hairStyle: traits.hairStyle,
            fashionDNA,
            avatarVersion: record.version ?? null,
            avatarImagePath: record.avatar_image || record.avatarImagePath || null,
            updatedAt: new Date().toISOString()
        };
    }
    resolveVector(record, fashionDNA) {
        const traits = this.resolveTraitsFromAvatarRecord(record);
        const text = (0, _digitalavatarembeddingutil.buildDigitalAvatarEmbeddingText)({
            ...traits,
            fashionDNA
        });
        return (0, _digitalavatarembeddingutil.buildDeterministicDigitalAvatarVector)(text, this.vectorSize);
    }
    async syncUserVector(userId, record) {
        if (!userId || !record) {
            return null;
        }
        if (!this.qdrantService.isConfigured()) {
            this.logger.debug(`Qdrant not configured — skipping digital avatar vector sync for user ${userId}`);
            return null;
        }
        const fashionDnaRecord = await this.fashionDnaRepository.findByUserId(userId);
        const fashionDNA = (0, _digitalavatarembeddingutil.extractFashionDnaSummary)(fashionDnaRecord);
        const vector = this.resolveVector(record, fashionDNA);
        const payload = this.buildPayload(userId, record, fashionDNA);
        await this.qdrantService.upsertDigitalAvatarVector(userId, vector, payload);
        this.logger.log(`Digital avatar vector synced | userId=${userId} | dimensions=${vector.length}`);
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
        return this.qdrantService.getDigitalAvatarVector(userId);
    }
    async searchSimilarUsers(userId, limit = 10) {
        if (!this.qdrantService.isConfigured()) {
            return [];
        }
        const vector = await this.getUserVector(userId);
        if (!vector?.length) {
            return [];
        }
        return this.qdrantService.searchDigitalAvatarSimilar(vector, limit, {
            excludeUserId: userId
        });
    }
};
DigitalAvatarVectorService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_qdrantservice.QdrantService)),
    _ts_param(1, (0, _common.Inject)(_config.ConfigService)),
    _ts_param(2, (0, _common.Inject)(_fashiondnarepository.FashionDnaRepository)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0,
        void 0
    ])
], DigitalAvatarVectorService);

//# sourceMappingURL=digital-avatar-vector.service.js.map