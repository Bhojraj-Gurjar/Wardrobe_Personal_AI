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
const _fashiondnaengineservice = require("./fashion-dna-engine.service");
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
    constructor(fashionDnaRepository, aiService, contextService, cacheService, historyService, vectorService, engineService, behavioralService, moduleRef){
        this.fashionDnaRepository = fashionDnaRepository;
        this.aiService = aiService;
        this.contextService = contextService;
        this.cacheService = cacheService;
        this.historyService = historyService;
        this.vectorService = vectorService;
        this.engineService = engineService;
        this.behavioralService = behavioralService;
        this.moduleRef = moduleRef;
        this.logger = new _common.Logger(FashionDnaService.name);
    }
    async getFashionDna(userId) {
        const cached = await this.cacheService.get(userId);
        if (cached && !(0, _fashiondnagenerator.isPlaceholderFashionDna)(cached)) {
            return cached;
        }
        const existing = await this.fashionDnaRepository.findByUserId(userId);
        if (!existing || (0, _fashiondnagenerator.isPlaceholderFashionDna)(existing)) {
            const generated = await this.generateFashionDnaIfReady(userId);
            if (generated) {
                return generated;
            }
        }
        if (existing) {
            const formatted = await this.formatFashionDna(existing, userId);
            await this.cacheService.set(userId, formatted);
            return formatted;
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
        if (!(0, _fashiondnagenerator.hasOnboardingFaceSignals)(context) || !(0, _fashiondnagenerator.hasOnboardingBodySignals)(context)) {
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
        const intelligence = await this.buildIntelligenceFromContext(context, payload);
        const mergedPayload = this.mergeIntelligenceIntoPayload(payload, intelligence);
        const existing = await this.fashionDnaRepository.findByUserId(userId);
        if (existing) {
            await this.historyService.archiveBeforeChange(existing, historySource);
        }
        const fashionDna = await this.fashionDnaRepository.upsert(userId, mergedPayload);
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
        const fallbackPayload = this.buildEngineOnlyPayload(context);
        if (!this.aiService.isConfigured()) {
            return fallbackPayload;
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
            this.logger.warn(`Fashion DNA AI analysis fallback for user ${userId}: ${error.message}`);
            return fallbackPayload;
        }
    }
    buildEngineOnlyPayload(context) {
        const { faceTraits, bodyTraits, onboarding, signals, preferences } = context;
        return (0, _fashiondnagenerator.mapAiResponseToPayload)({
            styleType: 'developing',
            fashionPersonality: null,
            colorAffinity: {},
            brandAffinity: signals?.favoriteBrandsRanked || {},
            categoryAffinity: signals?.favoriteCategories || {},
            budgetRange: onboarding?.budget_preference || preferences?.budget_preference || 'MID_RANGE',
            fashionConfidenceScore: 0,
            activityTraits: this.behavioralService.buildHistoryPayload(signals || {})
        }, {
            faceTraits,
            bodyTraits,
            onboarding
        });
    }
    async buildIntelligenceFromContext(context, payload = {}) {
        const preferenceTraits = payload.preference_traits || {};
        const activityTraits = payload.activity_traits || {};
        return this.engineService.buildIntelligence({
            faceTraits: context.faceTraits,
            bodyTraits: context.bodyTraits,
            onboarding: context.onboarding,
            preferences: context.preferences,
            preferenceTraits,
            signals: context.signals,
            colorAffinity: payload.color_affinity || {},
            brandAffinity: payload.brand_affinity || {},
            budgetRange: payload.budget_range,
            currency: context.signals?.productInteractions?.[0]?.product?.currency || 'INR'
        });
    }
    mergeIntelligenceIntoPayload(payload, intelligence) {
        const preferenceTraits = {
            ...payload.preference_traits || {},
            fashion_personality: intelligence.fashionPersonality,
            category_affinity: payload.preference_traits?.category_affinity || {}
        };
        const activityTraits = {
            ...payload.activity_traits || {},
            engine_version: 2,
            confidence_breakdown: intelligence.confidenceBreakdown,
            style_radar: intelligence.styleRadar,
            style_attributes: intelligence.styleAttributes,
            color_profile: intelligence.colorProfile,
            style_evolution: intelligence.styleEvolution,
            wardrobe_balance: intelligence.wardrobeBalance,
            ai_insights: intelligence.aiInsights,
            topColors: intelligence.colorProfile?.topColors || payload.activity_traits?.topColors || []
        };
        return {
            ...payload,
            fashion_confidence_score: intelligence.confidenceScore,
            preference_traits: preferenceTraits,
            activity_traits: activityTraits,
            brand_affinity: intelligence.brandAffinityList.length ? Object.fromEntries(intelligence.brandAffinityList.map((brand)=>[
                    brand.key,
                    Number((brand.percentage / 100).toFixed(4))
                ])) : payload.brand_affinity,
            budget_range: payload.budget_range
        };
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
        const isDefault = Boolean(preferenceTraits.isDefault || activityTraits.isDefault);
        let historyItems = [];
        let intelligence = null;
        let signals = null;
        if (userId) {
            const history = await this.historyService.getHistory(userId, {
                limit: 50
            });
            historyItems = history.items || [];
            const profile = await this.fashionDnaRepository.findUserProfile(userId);
            const preferences = profile?.preferences || {};
            signals = await this.behavioralService.collectSignals(userId, preferences);
            const intelligenceContext = isDefault ? await this.contextService.collectContext(userId) : null;
            intelligence = this.engineService.buildIntelligence({
                faceTraits: intelligenceContext?.faceTraits || fashionDna.face_traits || {},
                bodyTraits: intelligenceContext?.bodyTraits || fashionDna.body_traits || {},
                onboarding: intelligenceContext?.onboarding || (0, _fashiondnagenerator.extractOnboardingInputs)(profile),
                preferences,
                preferenceTraits,
                signals,
                colorAffinity: fashionDna.color_affinity || {},
                brandAffinity: fashionDna.brand_affinity || {},
                budgetRange: fashionDna.budget_range,
                currency: signals.productInteractions?.[0]?.product?.currency || 'INR'
            });
        }
        const confidenceScore = intelligence?.confidenceScore ?? Math.round(Number(fashionDna.fashion_confidence_score) || 0);
        const fashionPersonality = intelligence?.fashionPersonality || preferenceTraits.fashion_personality || null;
        const styleRadar = intelligence?.styleRadar || activityTraits.style_radar || {};
        const styleAttributes = intelligence?.styleAttributes || activityTraits.style_attributes || {};
        const budgetProfile = intelligence?.budgetProfile || {
            budgetRangeLabel: null,
            averageSpending: activityTraits.average_spending ?? null,
            spendProgress: 0,
            budgetType: null
        };
        const brandAffinityList = intelligence?.brandAffinityList || [];
        const colorProfile = intelligence?.colorProfile || activityTraits.color_profile || {
            primary: [],
            secondary: [],
            accent: [],
            avoid: [],
            topColors: activityTraits.topColors || []
        };
        const historyTimeline = this.engineService.deriveHistoryTimeline(historyItems, confidenceScore, fashionDna.updated_at);
        const weeklyGrowth = (0, _fashiondnaanalyticsutil.deriveWeeklyGrowth)(historyItems, confidenceScore);
        const livingProfile = userId && signals ? {
            searchBehaviour: signals.searchBehaviour || activityTraits.search_behaviour || null,
            shoppingInfluence: signals.shoppingInfluence || activityTraits.shopping_influence || null,
            recentlyInfluenced: signals.recentlyInfluenced || activityTraits.recently_influenced || [],
            discountPreference: signals.discountPreference || activityTraits.discount_preference || null,
            currentStyleMood: intelligence?.fashionPersonality || fashionPersonality,
            fashionJourney: historyItems.slice(0, 6).map((entry)=>({
                    styleType: entry.style_type,
                    confidenceScore: Math.round(Number(entry.fashion_confidence_score) || 0),
                    archivedAt: entry.archived_at,
                    changeReason: entry.change_reason,
                    changeSource: entry.change_source
                }))
        } : {
            searchBehaviour: activityTraits.search_behaviour || null,
            shoppingInfluence: activityTraits.shopping_influence || null,
            recentlyInfluenced: activityTraits.recently_influenced || [],
            discountPreference: activityTraits.discount_preference || null,
            currentStyleMood: fashionPersonality,
            fashionJourney: []
        };
        return {
            id: fashionDna.id,
            userId: fashionDna.user_id,
            isDefault,
            styleType: fashionDna.style_type,
            fashionPersonality,
            personalityDescription: (0, _fashiondnaanalyticsutil.derivePersonalityDescription)(fashionPersonality),
            colorAffinity: fashionDna.color_affinity,
            colorProfile,
            topColors: colorProfile.topColors || activityTraits.topColors || [],
            colorAffinityScore: activityTraits.colorAffinityScore ?? 0,
            budgetRange: fashionDna.budget_range,
            budgetRangeLabel: budgetProfile.budgetRangeLabel,
            budgetType: budgetProfile.budgetType,
            averageSpending: budgetProfile.averageSpending,
            spendProgress: budgetProfile.spendProgress,
            brandAffinity: fashionDna.brand_affinity,
            brandAffinityList,
            fashionConfidenceScore: confidenceScore,
            confidenceScore,
            confidenceBreakdown: intelligence?.confidenceBreakdown || activityTraits.confidence_breakdown || null,
            styleAttributes,
            styleRadar,
            historyTimeline,
            weeklyGrowth,
            aiInsights: intelligence?.aiInsights || activityTraits.ai_insights || [],
            styleEvolution: intelligence?.styleEvolution || activityTraits.style_evolution || [],
            wardrobeBalance: intelligence?.wardrobeBalance || activityTraits.wardrobe_balance || null,
            faceTraits: fashionDna.face_traits,
            bodyTraits: fashionDna.body_traits,
            preferenceTraits: fashionDna.preference_traits,
            activityTraits: fashionDna.activity_traits,
            searchBehaviour: livingProfile.searchBehaviour,
            shoppingInfluence: livingProfile.shoppingInfluence,
            recentlyInfluenced: livingProfile.recentlyInfluenced,
            discountPreference: livingProfile.discountPreference,
            currentStyleMood: livingProfile.currentStyleMood,
            fashionJourney: livingProfile.fashionJourney,
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
    _ts_param(6, (0, _common.Inject)(_fashiondnaengineservice.FashionDnaEngineService)),
    _ts_param(7, (0, _common.Inject)(_fashiondnabehavioralservice.FashionDnaBehavioralService)),
    _ts_param(8, (0, _common.Inject)(_core.ModuleRef)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0,
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