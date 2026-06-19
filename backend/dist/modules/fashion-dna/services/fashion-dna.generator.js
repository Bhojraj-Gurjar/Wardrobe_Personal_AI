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
    get buildFashionDnaPayload () {
        return buildFashionDnaPayload;
    },
    get calculateBrandAffinity () {
        return calculateBrandAffinity;
    },
    get calculateColorAffinity () {
        return calculateColorAffinity;
    },
    get calculateLifestyleScore () {
        return calculateLifestyleScore;
    },
    get calculateStyleScore () {
        return calculateStyleScore;
    }
});
const _dnaconstants = require("../validators/dna.constants");
function clampScore(value) {
    return Math.min(_dnaconstants.MAX_SCORE, Math.max(_dnaconstants.MIN_SCORE, Math.round(value)));
}
function calculateAgeScore(age) {
    if (!age) {
        return 0;
    }
    if (age >= 18 && age <= 35) {
        return 10;
    }
    if (age >= 36 && age <= 50) {
        return 5;
    }
    return 0;
}
function calculateLifestyleAgeScore(age) {
    if (!age) {
        return 40;
    }
    if (age <= 30) {
        return 75;
    }
    if (age <= 45) {
        return 65;
    }
    return 55;
}
function calculateStyleScore(profile) {
    let score = 50;
    if (profile?.body_type) {
        score += _dnaconstants.BODY_TYPE_STYLE_BOOST[profile.body_type] || 0;
    }
    score += calculateAgeScore(profile?.age);
    return clampScore(score);
}
function calculateColorAffinity(profile) {
    if (profile?.skin_tone && _dnaconstants.SKIN_TONE_COLOR_MAP[profile.skin_tone]) {
        return {
            ..._dnaconstants.SKIN_TONE_COLOR_MAP[profile.skin_tone]
        };
    }
    return {
        ..._dnaconstants.DEFAULT_COLOR_AFFINITY
    };
}
function calculateBrandAffinity(wishlistItems) {
    if (!wishlistItems.length) {
        return {
            undiscovered: 0.5
        };
    }
    const brandCounts = wishlistItems.reduce((counts, item)=>{
        const brandId = item.product?.brand_id;
        if (!brandId) {
            return counts;
        }
        counts[brandId] = (counts[brandId] || 0) + 1;
        return counts;
    }, {});
    const maxCount = Math.max(...Object.values(brandCounts), 1);
    return Object.entries(brandCounts).reduce((affinity, [brandId, count])=>{
        affinity[brandId] = Number((count / maxCount).toFixed(2));
        return affinity;
    }, {});
}
function calculateLifestyleScore(profile) {
    let score = calculateLifestyleAgeScore(profile?.age);
    if (profile?.body_type) {
        score += _dnaconstants.BODY_TYPE_LIFESTYLE_BOOST[profile.body_type] || 0;
    }
    if (profile?.gender === 'MALE') {
        score += 3;
    }
    if (profile?.gender === 'FEMALE') {
        score += 5;
    }
    return clampScore(score);
}
function buildFashionDnaPayload(profile, wishlistItems) {
    return {
        style_score: calculateStyleScore(profile),
        color_affinity: calculateColorAffinity(profile),
        brand_affinity: calculateBrandAffinity(wishlistItems),
        lifestyle_score: calculateLifestyleScore(profile)
    };
}

//# sourceMappingURL=fashion-dna.generator.js.map