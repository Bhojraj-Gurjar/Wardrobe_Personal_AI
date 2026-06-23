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
    get buildDeterministicFashionDnaVector () {
        return buildDeterministicFashionDnaVector;
    },
    get buildFashionDnaEmbeddingText () {
        return buildFashionDnaEmbeddingText;
    }
});
const _crypto = /*#__PURE__*/ _interop_require_default(require("crypto"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function normalizeKey(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}
function sortedAffinityTerms(affinity) {
    if (!affinity || typeof affinity !== 'object') {
        return '';
    }
    return Object.entries(affinity).sort(([left], [right])=>left.localeCompare(right)).map(([key, weight])=>`${key}:${Number(weight).toFixed(3)}`).join(' ');
}
function buildFashionDnaEmbeddingText(record) {
    const preferenceTraits = record.preferenceTraits || record.preference_traits || {};
    const activityTraits = record.activityTraits || record.activity_traits || {};
    const colorAffinity = record.colorAffinity || record.color_affinity || {};
    const brandAffinity = record.brandAffinity || record.brand_affinity || {};
    const categoryAffinity = preferenceTraits.category_affinity || record.categoryAffinity || {};
    const styleType = record.styleType || record.style_type || 'general';
    const personality = record.fashionPersonality || preferenceTraits.fashion_personality || activityTraits.fashionPersonality || styleType;
    return [
        `style ${styleType}`,
        `personality ${personality}`,
        `categories ${sortedAffinityTerms(categoryAffinity)}`,
        `colors ${sortedAffinityTerms(colorAffinity)}`,
        `brands ${sortedAffinityTerms(brandAffinity)}`
    ].join(' ').trim();
}
function buildDeterministicFashionDnaVector(text, targetSize = 384) {
    const digest = _crypto.default.createHash('sha256').update(text).digest();
    const seed = digest.readUInt32BE(0);
    const vector = new Array(targetSize).fill(0);
    for(let index = 0; index < targetSize; index += 1){
        const hash = Math.abs(((seed + index) * 9301 + 49297) % 233280);
        vector[index] = hash / 233280 * 2 - 1;
    }
    const magnitude = Math.sqrt(vector.reduce((sum, value)=>sum + value * value, 0));
    if (!magnitude) {
        return vector;
    }
    return vector.map((value)=>value / magnitude);
}

//# sourceMappingURL=fashion-dna-embedding.util.js.map