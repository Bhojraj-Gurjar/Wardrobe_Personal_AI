"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get FashionDnaHistoryService () {
        return FashionDnaHistoryService;
    },
    get HISTORY_CHANGE_SOURCES () {
        return _fashiondnahistoryconstants.HISTORY_CHANGE_SOURCES;
    }
});
const _common = require("@nestjs/common");
const _fashiondnahistoryconstants = require("../constants/fashion-dna-history.constants");
const _fashiondnahistoryrepository = require("../repositories/fashion-dna-history.repository");
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
let FashionDnaHistoryService = class FashionDnaHistoryService {
    constructor(historyRepository){
        this.historyRepository = historyRepository;
        this.logger = new _common.Logger(FashionDnaHistoryService.name);
    }
    buildSnapshotRecord(fashionDna, changeSource) {
        return {
            user_id: fashionDna.user_id,
            fashion_dna_id: fashionDna.id,
            change_reason: (0, _fashiondnahistoryconstants.resolveHistoryReason)(changeSource),
            change_source: changeSource,
            style_type: fashionDna.style_type,
            color_affinity: fashionDna.color_affinity,
            budget_range: fashionDna.budget_range,
            brand_affinity: fashionDna.brand_affinity,
            fashion_confidence_score: fashionDna.fashion_confidence_score,
            face_traits: fashionDna.face_traits,
            body_traits: fashionDna.body_traits,
            preference_traits: fashionDna.preference_traits,
            activity_traits: fashionDna.activity_traits || {},
            dna_created_at: fashionDna.created_at,
            dna_updated_at: fashionDna.updated_at
        };
    }
    async archiveBeforeChange(fashionDna, changeSource) {
        if (!fashionDna) {
            return null;
        }
        const record = await this.historyRepository.create(this.buildSnapshotRecord(fashionDna, changeSource));
        this.logger.log(`Fashion DNA history archived | userId=${fashionDna.user_id} | reason=${record.change_reason} | historyId=${record.id}`);
        return record;
    }
    async getHistory(userId, query = {}) {
        const records = await this.historyRepository.findByUserId(userId, query);
        return {
            items: records.map((record)=>this.formatHistoryRecord(record))
        };
    }
    formatHistoryRecord(record) {
        const preferenceTraits = record.preference_traits || {};
        const activityTraits = record.activity_traits || {};
        return {
            id: record.id,
            userId: record.user_id,
            fashionDnaId: record.fashion_dna_id,
            changeReason: record.change_reason,
            changeSource: record.change_source,
            styleType: record.style_type,
            fashionPersonality: preferenceTraits.fashion_personality || activityTraits.fashionPersonality || null,
            colorAffinity: record.color_affinity,
            topColors: activityTraits.topColors || [],
            colorAffinityScore: activityTraits.colorAffinityScore ?? 0,
            budgetRange: record.budget_range,
            brandAffinity: record.brand_affinity,
            fashionConfidenceScore: record.fashion_confidence_score,
            faceTraits: record.face_traits,
            bodyTraits: record.body_traits,
            preferenceTraits: record.preference_traits,
            activityTraits: record.activity_traits,
            dnaCreatedAt: record.dna_created_at,
            dnaUpdatedAt: record.dna_updated_at,
            archivedAt: record.archived_at
        };
    }
};
FashionDnaHistoryService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_fashiondnahistoryrepository.FashionDnaHistoryRepository)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], FashionDnaHistoryService);

//# sourceMappingURL=fashion-dna-history.service.js.map