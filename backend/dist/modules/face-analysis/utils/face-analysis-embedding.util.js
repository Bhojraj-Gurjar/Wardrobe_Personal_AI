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
    get buildDeterministicFaceAnalysisVector () {
        return buildDeterministicFaceAnalysisVector;
    },
    get buildFaceAnalysisEmbeddingText () {
        return buildFaceAnalysisEmbeddingText;
    }
});
const _fashiondnaembeddingutil = require("../../fashion-dna/utils/fashion-dna-embedding.util");
const TRAIT_FIELDS = [
    [
        'faceShape',
        'face_shape'
    ],
    [
        'skinTone',
        'skin_tone'
    ],
    [
        'hairLength',
        'hair_length'
    ],
    [
        'hairColor',
        'hair_color'
    ],
    [
        'hairStyle',
        'hair_style'
    ],
    [
        'beardType',
        'beard_type'
    ]
];
function normalizeTrait(value) {
    return String(value || 'unknown').trim().toLowerCase().replace(/\s+/g, '_');
}
function resolveTrait(record, camelKey, snakeKey) {
    return record[camelKey] ?? record[snakeKey] ?? null;
}
function buildFaceAnalysisEmbeddingText(record) {
    const parts = TRAIT_FIELDS.map(([camelKey, snakeKey])=>{
        const label = snakeKey.replace(/_/g, ' ');
        const value = normalizeTrait(resolveTrait(record, camelKey, snakeKey));
        return `${label} ${value}`;
    });
    return parts.join(' ').trim();
}
function buildDeterministicFaceAnalysisVector(text, targetSize = 384) {
    return (0, _fashiondnaembeddingutil.buildDeterministicFashionDnaVector)(text, targetSize);
}

//# sourceMappingURL=face-analysis-embedding.util.js.map