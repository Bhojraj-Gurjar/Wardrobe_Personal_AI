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
    get HISTORY_CHANGE_REASONS () {
        return HISTORY_CHANGE_REASONS;
    },
    get HISTORY_CHANGE_SOURCES () {
        return HISTORY_CHANGE_SOURCES;
    },
    get resolveHistoryReason () {
        return resolveHistoryReason;
    }
});
const _fashiondnaregenerationconstants = require("./fashion-dna-regeneration.constants");
const HISTORY_CHANGE_REASONS = {
    PROFILE_UPDATED: 'Profile Updated',
    PURCHASE_ACTIVITY: 'Purchase Activity',
    WISHLIST_ACTIVITY: 'Wishlist Activity',
    BROWSING_ACTIVITY: 'Browsing Activity',
    FACE_ANALYSIS: 'Face Analysis Updated',
    AI_REGENERATION: 'AI Regeneration',
    MANUAL_UPDATE: 'Manual Update'
};
const HISTORY_CHANGE_SOURCES = {
    MANUAL_UPDATE: 'manual_update',
    AI_REGENERATION: 'ai_regeneration',
    GENERATE: 'generate'
};
const SOURCE_TO_REASON = {
    [_fashiondnaregenerationconstants.REFRESH_SOURCES.PROFILE_UPDATE]: HISTORY_CHANGE_REASONS.PROFILE_UPDATED,
    [_fashiondnaregenerationconstants.REFRESH_SOURCES.BODY_ANALYSIS]: HISTORY_CHANGE_REASONS.PROFILE_UPDATED,
    [_fashiondnaregenerationconstants.REFRESH_SOURCES.FACE_ANALYSIS]: HISTORY_CHANGE_REASONS.FACE_ANALYSIS,
    [_fashiondnaregenerationconstants.REFRESH_SOURCES.WISHLIST_UPDATE]: HISTORY_CHANGE_REASONS.WISHLIST_ACTIVITY,
    [_fashiondnaregenerationconstants.REFRESH_SOURCES.PURCHASE]: HISTORY_CHANGE_REASONS.PURCHASE_ACTIVITY,
    [_fashiondnaregenerationconstants.REFRESH_SOURCES.BROWSING_ACTIVITY]: HISTORY_CHANGE_REASONS.BROWSING_ACTIVITY,
    [_fashiondnaregenerationconstants.REFRESH_SOURCES.PRODUCT_VIEW]: HISTORY_CHANGE_REASONS.BROWSING_ACTIVITY,
    [_fashiondnaregenerationconstants.REFRESH_SOURCES.SEARCH]: HISTORY_CHANGE_REASONS.BROWSING_ACTIVITY,
    [HISTORY_CHANGE_SOURCES.MANUAL_UPDATE]: HISTORY_CHANGE_REASONS.MANUAL_UPDATE,
    [HISTORY_CHANGE_SOURCES.AI_REGENERATION]: HISTORY_CHANGE_REASONS.AI_REGENERATION,
    [HISTORY_CHANGE_SOURCES.GENERATE]: HISTORY_CHANGE_REASONS.AI_REGENERATION
};
function resolveHistoryReason(changeSource) {
    return SOURCE_TO_REASON[changeSource] || HISTORY_CHANGE_REASONS.AI_REGENERATION;
}

//# sourceMappingURL=fashion-dna-history.constants.js.map