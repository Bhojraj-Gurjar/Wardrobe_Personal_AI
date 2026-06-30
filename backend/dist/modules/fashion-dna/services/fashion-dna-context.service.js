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
    get FashionDnaContextService () {
        return FashionDnaContextService;
    },
    get hasBehavioralActivity () {
        return hasBehavioralActivity;
    }
});
const _common = require("@nestjs/common");
const _bodyanalysisservice = require("../../body-analysis/body-analysis.service");
const _bodyprofileinsightsservice = require("../../body-analysis/services/body-profile-insights.service");
const _faceanalysisservice = require("../../face-analysis/face-analysis.service");
const _fashiondnarepository = require("../repositories/fashion-dna.repository");
const _fashiondnabehavioralservice = require("./fashion-dna-behavioral.service");
const _fashiondnagenerator = require("./fashion-dna.generator");
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
function mapWishlistItems(items) {
    return items.map((item)=>({
            product_id: item.product_id,
            brand_id: item.product?.brand_id || null,
            category_id: item.product?.category_id || null,
            color: item.product?.color || null,
            price: item.product?.price ?? null,
            added_at: item.created_at
        }));
}
function mapOrders(orders) {
    return orders.map((order)=>({
            id: order.id,
            total_amount: order.total_amount,
            status: order.status,
            created_at: order.created_at,
            product_id: order.product_id || null,
            brand_id: order.product?.brand_id || null,
            color: order.product?.color || null
        }));
}
function mapProductViews(views) {
    return views.map((view)=>({
            product_id: view.product_id,
            brand_id: view.product?.brand_id || null,
            category_id: view.product?.category_id || null,
            color: view.product?.color || null,
            price: view.product?.price ?? null,
            viewed_at: view.viewed_at
        }));
}
function mapSearches(searches) {
    return searches.map((entry)=>({
            query: entry.query,
            searched_at: entry.searched_at
        }));
}
function hasBehavioralActivity(signals) {
    const volume = signals?.activityVolume || {};
    return Number(volume.wishlist || 0) > 0 || Number(volume.orders || 0) > 0 || Number(volume.product_views || 0) > 0 || Number(volume.searches || 0) > 0 || Number(volume.cart || 0) > 0 || Number(volume.closet || 0) > 0 || Number(volume.try_on || 0) > 0 || Number(volume.virtual_try_on || 0) > 0 || Number(volume.saved_looks || 0) > 0;
}
let FashionDnaContextService = class FashionDnaContextService {
    constructor(fashionDnaRepository, faceAnalysisService, bodyAnalysisService, bodyProfileInsightsService, behavioralService){
        this.fashionDnaRepository = fashionDnaRepository;
        this.faceAnalysisService = faceAnalysisService;
        this.bodyAnalysisService = bodyAnalysisService;
        this.bodyProfileInsightsService = bodyProfileInsightsService;
        this.behavioralService = behavioralService;
    }
    async collectContext(userId) {
        const profile = await this.fashionDnaRepository.findUserProfile(userId);
        const preferences = profile?.preferences || {};
        const [faceTraits, visualFaceTraits, storedBodyTraits, signals] = await Promise.all([
            this.faceAnalysisService.collectBiometricTraits(userId),
            this.faceAnalysisService.getStoredTraits(userId),
            this.bodyAnalysisService.getStoredTraits(userId),
            this.behavioralService.collectSignals(userId, preferences)
        ]);
        const profileInsights = this.bodyProfileInsightsService.analyze(profile);
        const bodyTraits = storedBodyTraits ? {
            ...profileInsights,
            ...storedBodyTraits,
            analysis_source: 'body_analysis_record'
        } : profileInsights;
        const onboarding = (0, _fashiondnagenerator.extractOnboardingInputs)(profile);
        return {
            profile,
            faceTraits: {
                ...faceTraits,
                ...visualFaceTraits || {},
                ...profile?.skin_tone && !visualFaceTraits?.skin_tone ? {
                    skin_tone: profile.skin_tone
                } : {}
            },
            bodyTraits,
            preferences,
            onboarding,
            signals,
            history: this.behavioralService.buildHistoryPayload(signals)
        };
    }
    buildAnalyzePayload(context) {
        const { faceTraits, bodyTraits, preferences, signals, history } = context;
        return {
            face_traits: faceTraits,
            body_traits: bodyTraits,
            preferences: {
                ...preferences,
                onboarding_profile: {
                    gender: context.onboarding.gender,
                    age: context.onboarding.age,
                    height: context.onboarding.height,
                    weight: context.onboarding.weight,
                    country: context.onboarding.country,
                    language: context.onboarding.language
                }
            },
            history: {
                ...history,
                wishlist: mapWishlistItems(signals.wishlistItems),
                orders: mapOrders(signals.orders),
                product_views: mapProductViews(signals.productViews),
                searches: mapSearches(signals.searchHistory)
            }
        };
    }
};
FashionDnaContextService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_fashiondnarepository.FashionDnaRepository)),
    _ts_param(1, (0, _common.Inject)(_faceanalysisservice.FaceAnalysisService)),
    _ts_param(2, (0, _common.Inject)(_bodyanalysisservice.BodyAnalysisService)),
    _ts_param(3, (0, _common.Inject)(_bodyprofileinsightsservice.BodyProfileInsightsService)),
    _ts_param(4, (0, _common.Inject)(_fashiondnabehavioralservice.FashionDnaBehavioralService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0,
        void 0,
        void 0,
        void 0
    ])
], FashionDnaContextService);

//# sourceMappingURL=fashion-dna-context.service.js.map