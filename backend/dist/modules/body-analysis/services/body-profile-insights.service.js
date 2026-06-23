"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyProfileInsightsService", {
    enumerable: true,
    get: function() {
        return BodyProfileInsightsService;
    }
});
const _common = require("@nestjs/common");
const _bodyanalysisconstants = require("../constants/body-analysis.constants");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function computeBmi(heightCm, weightKg) {
    if (!heightCm || !weightKg || heightCm <= 0) {
        return null;
    }
    const heightMeters = heightCm / 100;
    return Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
}
function classifyBmi(bmi) {
    if (bmi === null || bmi === undefined) {
        return null;
    }
    if (bmi < 18.5) {
        return _bodyanalysisconstants.BMI_CATEGORY.UNDERWEIGHT;
    }
    if (bmi < 25) {
        return _bodyanalysisconstants.BMI_CATEGORY.NORMAL;
    }
    if (bmi < 30) {
        return _bodyanalysisconstants.BMI_CATEGORY.OVERWEIGHT;
    }
    return _bodyanalysisconstants.BMI_CATEGORY.OBESE;
}
let BodyProfileInsightsService = class BodyProfileInsightsService {
    analyze(profile) {
        const bmi = computeBmi(profile?.height, profile?.weight);
        const bodyType = profile?.body_type || null;
        const skinTone = profile?.skin_tone || null;
        return {
            gender: profile?.gender ?? null,
            age: profile?.age ?? null,
            height: profile?.height ?? null,
            weight: profile?.weight ?? null,
            country: profile?.country ?? null,
            language: profile?.language ?? null,
            body_type: bodyType,
            skin_tone: skinTone,
            bmi,
            bmi_category: classifyBmi(bmi),
            style_fit_hint: bodyType ? _bodyanalysisconstants.BODY_TYPE_STYLE_FIT[bodyType] || null : null,
            lifestyle_hint: bodyType ? _bodyanalysisconstants.BODY_TYPE_LIFESTYLE_HINT[bodyType] || null : null,
            complementary_colors: skinTone ? _bodyanalysisconstants.SKIN_TONE_COLOR_MAP[skinTone] || [] : [],
            analysis_source: 'body_profile_insights',
            analyzed_at: new Date().toISOString()
        };
    }
};
BodyProfileInsightsService = _ts_decorate([
    (0, _common.Injectable)()
], BodyProfileInsightsService);

//# sourceMappingURL=body-profile-insights.service.js.map