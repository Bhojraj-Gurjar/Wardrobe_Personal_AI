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
    get buildBodyAnalysisEmbeddingText () {
        return buildBodyAnalysisEmbeddingText;
    },
    get buildDeterministicBodyAnalysisVector () {
        return buildDeterministicBodyAnalysisVector;
    }
});
const _fashiondnaembeddingutil = require("../../fashion-dna/utils/fashion-dna-embedding.util");
const MEASUREMENT_KEYS = [
    'height',
    'shoulderWidth',
    'chest',
    'waist',
    'hip',
    'armLength',
    'legLength'
];
function normalizeTrait(value) {
    return String(value || 'unknown').trim().toLowerCase().replace(/\s+/g, '_');
}
function resolveMeasurements(record) {
    const raw = record.raw_ai_response || {};
    return record.measurements ?? raw.measurements ?? null;
}
function resolveFitProfile(record) {
    return record.fitProfile ?? record.fit_profile ?? null;
}
function measurementValue(field) {
    if (field === null || field === undefined) {
        return null;
    }
    if (typeof field === 'object') {
        return field.value ?? field.normalized ?? null;
    }
    return field;
}
function buildMeasurementText(measurements) {
    if (!measurements || typeof measurements !== 'object') {
        return [];
    }
    return MEASUREMENT_KEYS.map((key)=>{
        const value = measurementValue(measurements[key]);
        if (value === null || value === undefined) {
            return null;
        }
        return `${key} ${value}`;
    }).filter(Boolean);
}
function buildFitProfileText(fitProfile) {
    if (!fitProfile || typeof fitProfile !== 'object') {
        return [];
    }
    const parts = [];
    if (fitProfile.summary) {
        parts.push(`summary ${normalizeTrait(fitProfile.summary)}`);
    }
    if (Array.isArray(fitProfile.sections)) {
        for (const section of fitProfile.sections){
            if (!section?.id) {
                continue;
            }
            const recommendations = Array.isArray(section.recommendations) ? section.recommendations.map((item)=>normalizeTrait(item)).join(' ') : '';
            parts.push(`${section.id} ${normalizeTrait(section.fit || '')} ${recommendations}`.trim());
        }
    }
    return parts;
}
function buildBodyAnalysisEmbeddingText(record) {
    const bodyType = normalizeTrait(record.bodyType ?? record.body_type);
    const bodyShape = normalizeTrait(record.bodyShape ?? record.body_shape);
    const measurements = resolveMeasurements(record);
    const fitProfile = resolveFitProfile(record);
    return [
        `body type ${bodyType}`,
        `body shape ${bodyShape}`,
        ...buildMeasurementText(measurements),
        ...buildFitProfileText(fitProfile)
    ].join(' ').trim();
}
function buildDeterministicBodyAnalysisVector(text, targetSize = 384) {
    return (0, _fashiondnaembeddingutil.buildDeterministicFashionDnaVector)(text, targetSize);
}

//# sourceMappingURL=body-analysis-embedding.util.js.map