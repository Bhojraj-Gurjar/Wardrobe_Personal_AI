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
    get BODY_ANALYSIS_PROFILE_FIELDS () {
        return BODY_ANALYSIS_PROFILE_FIELDS;
    },
    get REFRESH_SOURCES () {
        return REFRESH_SOURCES;
    },
    get resolveProfileRegenerationSource () {
        return resolveProfileRegenerationSource;
    }
});
const REFRESH_SOURCES = {
    PROFILE_UPDATE: 'profile_update',
    BODY_ANALYSIS: 'body_analysis',
    FACE_ANALYSIS: 'face_analysis',
    WISHLIST_UPDATE: 'wishlist_update',
    PURCHASE: 'purchase',
    PRODUCT_VIEW: 'product_view',
    SEARCH: 'search',
    BROWSING_ACTIVITY: 'browsing_activity'
};
const BODY_ANALYSIS_PROFILE_FIELDS = [
    'height',
    'weight',
    'body_type',
    'skin_tone',
    'gender',
    'age'
];
function resolveProfileRegenerationSource(dto) {
    const hasBodyFields = BODY_ANALYSIS_PROFILE_FIELDS.some((field)=>dto[field] !== undefined);
    return hasBodyFields ? REFRESH_SOURCES.BODY_ANALYSIS : REFRESH_SOURCES.PROFILE_UPDATE;
}

//# sourceMappingURL=fashion-dna-regeneration.constants.js.map