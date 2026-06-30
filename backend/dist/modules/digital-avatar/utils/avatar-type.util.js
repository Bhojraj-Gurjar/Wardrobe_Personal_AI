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
    get AVATAR_RENDER_CAPABILITIES () {
        return AVATAR_RENDER_CAPABILITIES;
    },
    get AvatarTraitRequirement () {
        return AvatarTraitRequirement;
    },
    get getAvatarRenderCapabilities () {
        return getAvatarRenderCapabilities;
    },
    get getAvatarTraitRequirement () {
        return getAvatarTraitRequirement;
    },
    get isAvatarTypeImplemented () {
        return isAvatarTypeImplemented;
    },
    get isCanonicalRenderMode () {
        return isCanonicalRenderMode;
    },
    get isLegacyProceduralAvatarType () {
        return isLegacyProceduralAvatarType;
    },
    get normalizeAvatarType () {
        return normalizeAvatarType;
    },
    get resolveAiAvatarType () {
        return resolveAiAvatarType;
    }
});
const _digitalavatarconstants = require("../constants/digital-avatar.constants");
const AvatarTraitRequirement = {
    BASIC: 'basic',
    PREMIUM: 'premium',
    DIGITAL_TWIN: 'digital_twin'
};
const AVATAR_RENDER_CAPABILITIES = {
    [_digitalavatarconstants.AvatarRenderMode.BASIC_2D]: {
        dimension: '2d',
        outputFormat: 'png',
        storageKind: 'image',
        implemented: true,
        traitRequirement: AvatarTraitRequirement.BASIC,
        aiRouteKey: 'BASIC'
    },
    [_digitalavatarconstants.AvatarRenderMode.PREMIUM_PHOTOREALISTIC]: {
        dimension: '2d',
        outputFormat: 'png',
        storageKind: 'image',
        implemented: true,
        traitRequirement: AvatarTraitRequirement.PREMIUM,
        aiRouteKey: 'PREMIUM'
    },
    [_digitalavatarconstants.AvatarRenderMode.DIGITAL_TWIN_3D]: {
        dimension: '3d',
        outputFormat: 'glb',
        storageKind: 'mesh',
        implemented: false,
        traitRequirement: AvatarTraitRequirement.DIGITAL_TWIN,
        aiRouteKey: 'DIGITAL_TWIN_3D'
    }
};
function normalizeAvatarType(avatarType = _digitalavatarconstants.DEFAULT_AVATAR_TYPE) {
    const normalized = String(avatarType || _digitalavatarconstants.DEFAULT_AVATAR_TYPE).trim().toUpperCase();
    return _digitalavatarconstants.LEGACY_AVATAR_TYPE_ALIASES[normalized] || normalized;
}
function isCanonicalRenderMode(avatarType) {
    return _digitalavatarconstants.AVATAR_RENDER_MODES.includes(normalizeAvatarType(avatarType));
}
function isLegacyProceduralAvatarType(avatarType) {
    return _digitalavatarconstants.LEGACY_PROCEDURAL_AVATAR_TYPES.includes(String(avatarType || '').trim().toUpperCase());
}
function getAvatarRenderCapabilities(avatarType) {
    const canonical = normalizeAvatarType(avatarType);
    if (AVATAR_RENDER_CAPABILITIES[canonical]) {
        return AVATAR_RENDER_CAPABILITIES[canonical];
    }
    if (isLegacyProceduralAvatarType(avatarType)) {
        return {
            dimension: '2d',
            outputFormat: 'png',
            storageKind: 'image',
            implemented: true,
            traitRequirement: AvatarTraitRequirement.BASIC,
            aiRouteKey: String(avatarType).trim().toUpperCase()
        };
    }
    return null;
}
function resolveAiAvatarType(avatarType) {
    const capabilities = getAvatarRenderCapabilities(avatarType);
    if (capabilities?.aiRouteKey) {
        return capabilities.aiRouteKey;
    }
    return normalizeAvatarType(avatarType);
}
function isAvatarTypeImplemented(avatarType) {
    const capabilities = getAvatarRenderCapabilities(avatarType);
    if (!capabilities) {
        return false;
    }
    return capabilities.implemented;
}
function getAvatarTraitRequirement(avatarType) {
    const capabilities = getAvatarRenderCapabilities(avatarType);
    return capabilities?.traitRequirement || AvatarTraitRequirement.BASIC;
}

//# sourceMappingURL=avatar-type.util.js.map