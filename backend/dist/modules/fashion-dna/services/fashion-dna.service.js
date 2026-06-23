"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FashionDnaService", {
    enumerable: true,
    get: function() {
        return FashionDnaService;
    }
});
const _common = require("@nestjs/common");
const _core = require("@nestjs/core");
const _fashiondnarepository = require("../repositories/fashion-dna.repository");
const _aiservice = require("../../ai/services/ai.service");
const _fashiondnabehavioralservice = require("./fashion-dna-behavioral.service");
const _fashiondnacontextservice = require("./fashion-dna-context.service");
const _fashiondnagenerator = require("./fashion-dna.generator");
const _fashiondnacacheservice = require("./fashion-dna-cache.service");
const _fashiondnahistoryservice = require("./fashion-dna-history.service");
const _fashiondnavectorservice = require("./fashion-dna-vector.service");
const _fashiondnaanalyticsutil = require("../utils/fashion-dna-analytics.util");
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
function resolveUserArtifacts(moduleRef) {
    const { UserArtifactsService } = require('../../user-artifacts/user-artifacts.service');
    return moduleRef.get(UserArtifactsService, {
        strict: false
    });
}
let FashionDnaService = class FashionDnaService {
    constructor(fashionDnaRepository, aiService, contextService, cacheService, historyService, vectorService, moduleRef){
        this.fashionDnaRepository = fashionDnaRepository;
        this.aiService = aiService;
        this.contextService = contextService;
        this.cacheService = cacheService;
        this.historyService = historyService;
        this.vectorService = vectorService;
        this.moduleRef = moduleRef;
        this.logger = new _common.Logger(FashionDnaService.name);
    }
    async getFashionDna(userId) {
        const cached = await this.cacheService.get(userId);
        if (cached) {
            return cached;
        }
        return resolveUserArtifacts(this.moduleRef).ensureFashionDna(userId);
    }
    async generateFashionDna(userId) {
        const context = await this.contextService.collectContext(userId);
        if (!context.profile) {
            throw new _common.BadRequestException('Complete your profile before generating Fashion DNA');
        }
        this.ensureOnboardingComplete(context.profile);
        this.ensureBehavioralActivity(context.signals);
        return this.persistFashionDna(userId, context, _fashiondnahistoryservice.HISTORY_CHANGE_SOURCES.GENERATE);
    }
    async generateFashionDnaIfReady(userId) {
        const context = await this.contextService.collectContext(userId);
        if (!context.profile) {
            return null;
        }
        const missingOnboarding = (0, _fashiondnagenerator.getMissingOnboardingFields)(context.onboarding);
        if (missingOnboarding.length) {
            return null;
        }
        const hasFaceAnalysis = Boolean(context.faceTraits?.face_shape || context.faceTraits?.faceShape);
        const hasBodyAnalysis = Boolean(context.bodyTraits?.body_type || context.bodyTraits?.bodyType || context.bodyTraits?.analysis_source === 'body_analysis_record');
        if (!hasFaceAnalysis || !hasBodyAnalysis) {
            return null;
        }
        return this.persistFashionDna(userId, context, _fashiondnahistoryservice.HISTORY_CHANGE_SOURCES.GENERATE, {
            skipBehavioralCheck: true
        });
    }
    async persistFashionDna(userId, context, historySource, options = {}) {
        if (!options.skipBehavioralCheck) {
            this.ensureBehavioralActivity(context.signals);
        }
        const payload = await this.analyzeWithAi(userId, context);
        const existing = await this.fashionDnaRepository.findByUserId(userId);
        if (existing) {
            await this.historyService.archiveBeforeChange(existing, historySource);
        }
        const fashionDna = await this.fashionDnaRepository.upsert(userId, payload);
        const formatted = await this.formatFashionDna(fashionDna, userId);
        await this.cacheService.invalidate(userId);
        await this.cacheService.set(userId, formatted);
        return formatted;
    }
    ensureOnboardingComplete(profile) {
        const inputs = (0, _fashiondnagenerator.extractOnboardingInputs)(profile);
        const missing = (0, _fashiondnagenerator.getMissingOnboardingFields)(inputs);
        if (missing.length) {
            throw new _common.BadRequestException(`Complete onboarding before generating Fashion DNA. Missing: ${missing.join(', ')}`);
        }
    }
    ensureBehavioralActivity(signals) {
        if (!(0, _fashiondnacontextservice.hasBehavioralActivity)(signals)) {
            throw new _common.BadRequestException('Fashion DNA requires shopping activity. Add wishlist items, browse products, place an order, or search before generating.');
        }
    }
    async updateFashionDna(userId, dto) {
        const existing = await this.fashionDnaRepository.findByUserId(userId);
        if (!existing) {
            throw new _common.NotFoundException('Fashion DNA not found. Generate it first using POST /fashion-dna/generate');
        }
        const data = this.mapUpdateDtoToData(dto);
        if (!Object.keys(data).length) {
            throw new _common.BadRequestException('Provide at least one field to update');
        }
        await this.historyService.archiveBeforeChange(existing, _fashiondnahistoryservice.HISTORY_CHANGE_SOURCES.MANUAL_UPDATE);
        const fashionDna = await this.fashionDnaRepository.updateByUserId(userId, data);
        const formatted = await this.formatFashionDna(fashionDna, userId);
        await this.vectorService.syncUserVector(userId, formatted);
        await this.cacheService.invalidate(userId);
        await this.cacheService.set(userId, formatted);
        return formatted;
    }
    async analyzeWithAi(userId, context) {
        if (!this.aiService.isConfigured()) {
            throw new _common.ServiceUnavailableException('Fashion DNA analysis unavailable — AI service is not configured');
        }
        const analyzePayload = this.contextService.buildAnalyzePayload(context);
        try {
            const aiResponse = await this.aiService.analyzeFashionDna({
                ...analyzePayload,
                user_id: userId
            });
            await this.vectorService.syncUserVector(userId, aiResponse);
            return (0, _fashiondnagenerator.mapAiResponseToPayload)(aiResponse, context);
        } catch (error) {
            this.logger.error(`Fashion DNA AI analysis failed for user ${userId}: ${error.message}`);
            throw error;
        }
    }
    mapUpdateDtoToData(dto) {
        const data = {};
        if (dto.style_type !== undefined) data.style_type = dto.style_type;
        if (dto.color_affinity !== undefined) data.color_affinity = dto.color_affinity;
        if (dto.budget_range !== undefined) data.budget_range = dto.budget_range;
        if (dto.brand_affinity !== undefined) data.brand_affinity = dto.brand_affinity;
        if (dto.fashion_confidence_score !== undefined) {
            data.fashion_confidence_score = dto.fashion_confidence_score;
        }
        if (dto.face_traits !== undefined) data.face_traits = dto.face_traits;
        if (dto.body_traits !== undefined) data.body_traits = dto.body_traits;
        if (dto.preference_traits !== undefined) {
            data.preference_traits = dto.preference_traits;
        }
        if (dto.activity_traits !== undefined) {
            data.activity_traits = dto.activity_traits;
        }
        return data;
    }
    async getFashionDnaHistory(userId, query = {}) {
        return this.historyService.getHistory(userId, query);
    }
    async formatFashionDna(fashionDna, userId = null) {
        const activityTraits = fashionDna.activity_traits || {};
        const preferenceTraits = fashionDna.preference_traits || {};
        const categoryAffinity = preferenceTraits.category_affinity || {};
        const fashionPersonality = preferenceTraits.fashion_personality || activityTraits.fashionPersonality || null;
        const confidenceScore = Math.round(Number(fashionDna.fashion_confidence_score) || 0);
        const averageSpending = activityTraits.average_spending ?? null;
        const budgetDisplay = (0, _fashiondnaanalyticsutil.deriveBudgetDisplay)(fashionDna.budget_range, averageSpending);
        let historyItems = [];
        if (userId) {
            const history = await this.historyService.getHistory(userId, {
                limit: 50
            });
            historyItems = history.items || [];
        }
        const styleAttributes = (0, _fashiondnaanalyticsutil.deriveStyleAttributes)(categoryAffinity, fashionPersonality);
        const styleRadar = (0, _fashiondnaanalyticsutil.deriveStyleRadar)(categoryAffinity, fashionPersonality);
        const historyTimeline = (0, _fashiondnaanalyticsutil.deriveHistoryTimeline)(historyItems, confidenceScore, fashionDna.updated_at);
        const weeklyGrowth = (0, _fashiondnaanalyticsutil.deriveWeeklyGrowth)(historyItems, confidenceScore);
        return {
            id: fashionDna.id,
            userId: fashionDna.user_id,
            styleType: fashionDna.style_type,
            fashionPersonality,
            personalityDescription: (0, _fashiondnaanalyticsutil.derivePersonalityDescription)(fashionPersonality),
            percentileLabel: (0, _fashiondnaanalyticsutil.derivePercentileLabel)(confidenceScore),
            colorAffinity: fashionDna.color_affinity,
            topColors: activityTraits.topColors || [],
            colorAffinityScore: activityTraits.colorAffinityScore ?? 0,
            budgetRange: fashionDna.budget_range,
            budgetRangeLabel: budgetDisplay.budgetRangeLabel,
            averageSpending: budgetDisplay.averageSpending,
            spendProgress: budgetDisplay.spendProgress,
            brandAffinity: fashionDna.brand_affinity,
            brandAffinityList: (0, _fashiondnaanalyticsutil.formatBrandAffinityList)(fashionDna.brand_affinity),
            fashionConfidenceScore: confidenceScore,
            confidenceScore,
            styleAttributes,
            styleRadar,
            historyTimeline,
            weeklyGrowth,
            faceTraits: fashionDna.face_traits,
            bodyTraits: fashionDna.body_traits,
            preferenceTraits: fashionDna.preference_traits,
            activityTraits: fashionDna.activity_traits,
            createdAt: fashionDna.created_at,
            updatedAt: fashionDna.updated_at
        };
    }
};
FashionDnaService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_fashiondnarepository.FashionDnaRepository)),
    _ts_param(1, (0, _common.Inject)(_aiservice.AiService)),
    _ts_param(2, (0, _common.Inject)(_fashiondnacontextservice.FashionDnaContextService)),
    _ts_param(3, (0, _common.Inject)(_fashiondnacacheservice.FashionDnaCacheService)),
    _ts_param(4, (0, _common.Inject)(_fashiondnahistoryservice.FashionDnaHistoryService)),
    _ts_param(5, (0, _common.Inject)(_fashiondnavectorservice.FashionDnaVectorService)),
    _ts_param(6, (0, _common.Inject)(_core.ModuleRef)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0
    ])
], FashionDnaService);

//# sourceMappingURL=fashion-dna.service.js.map