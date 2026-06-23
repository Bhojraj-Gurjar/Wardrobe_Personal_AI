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
    get formatDigitalAvatarHistory () {
        return formatDigitalAvatarHistory;
    },
    get formatDigitalAvatarHistoryEntry () {
        return formatDigitalAvatarHistoryEntry;
    },
    get formatDigitalAvatarHistoryList () {
        return formatDigitalAvatarHistoryList;
    },
    get formatDigitalAvatarRecord () {
        return formatDigitalAvatarRecord;
    }
});
const _avatartypeutil = require("./avatar-type.util");
function formatDigitalAvatarRecord(record, resolvePublicUrl) {
    const metadata = record.raw_ai_response?.metadata ?? null;
    const rawAiResponse = record.raw_ai_response ?? null;
    const avatarImagePath = record.avatar_image;
    const avatarType = (0, _avatartypeutil.normalizeAvatarType)(record.avatar_type);
    return {
        id: record.id,
        userId: record.user_id,
        avatarType,
        avatarImagePath,
        avatarImage: resolvePublicUrl ? resolvePublicUrl(avatarImagePath) : avatarImagePath,
        version: record.version,
        isActive: record.is_active,
        metadata,
        gender: metadata?.gender ?? null,
        age: metadata?.age ?? null,
        bodyType: metadata?.bodyType ?? null,
        skinTone: metadata?.skinTone ?? metadata?.faceAnalysis?.skinTone ?? null,
        faceAnalysis: metadata?.faceAnalysis ?? null,
        hairAnalysis: metadata?.hairAnalysis ?? null,
        beardAnalysis: metadata?.beardAnalysis ?? null,
        bodyAnalysis: metadata?.bodyAnalysis ?? null,
        traitFingerprint: metadata?.traitFingerprint ?? null,
        quality: metadata?.quality ?? null,
        confidence: rawAiResponse?.confidence ?? metadata?.confidence ?? null,
        createdAt: record.created_at,
        updatedAt: record.updated_at
    };
}
function formatDigitalAvatarHistoryEntry(record, resolvePublicUrl) {
    const avatarImagePath = record.avatar_image;
    const avatarType = (0, _avatartypeutil.normalizeAvatarType)(record.avatar_type);
    return {
        version: record.version,
        type: avatarType,
        avatarType,
        avatarImagePath,
        avatarImage: resolvePublicUrl ? resolvePublicUrl(avatarImagePath) : avatarImagePath,
        createdAt: record.created_at,
        id: record.id,
        isActive: record.is_active
    };
}
function formatDigitalAvatarHistoryList(records, resolvePublicUrl) {
    return [
        ...records
    ].sort((left, right)=>left.version - right.version).map((record)=>formatDigitalAvatarHistoryEntry(record, resolvePublicUrl));
}
function formatDigitalAvatarHistory(records, resolvePublicUrl) {
    return formatDigitalAvatarHistoryList(records, resolvePublicUrl);
}

//# sourceMappingURL=digital-avatar.mapper.js.map