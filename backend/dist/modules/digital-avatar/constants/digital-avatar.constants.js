/**
 * Canonical avatar render modes.
 * Legacy API values (BASIC, PREMIUM) are normalized via avatar-type.util.js.
 */ "use strict";
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
    get AVATAR_RENDER_MODES () {
        return AVATAR_RENDER_MODES;
    },
    get AVATAR_TYPES () {
        return AVATAR_TYPES;
    },
    get AvatarRenderMode () {
        return AvatarRenderMode;
    },
    get BASIC_AVATAR_TYPE () {
        return BASIC_AVATAR_TYPE;
    },
    get DEFAULT_AVATAR_TYPE () {
        return DEFAULT_AVATAR_TYPE;
    },
    get DIGITAL_TWIN_3D_AVATAR_TYPE () {
        return DIGITAL_TWIN_3D_AVATAR_TYPE;
    },
    get LEGACY_AVATAR_TYPE_ALIASES () {
        return LEGACY_AVATAR_TYPE_ALIASES;
    },
    get LEGACY_PROCEDURAL_AVATAR_TYPES () {
        return LEGACY_PROCEDURAL_AVATAR_TYPES;
    },
    get PREMIUM_AVATAR_TYPE () {
        return PREMIUM_AVATAR_TYPE;
    }
});
const AvatarRenderMode = {
    BASIC_2D: 'BASIC_2D',
    PREMIUM_PHOTOREALISTIC: 'PREMIUM_PHOTOREALISTIC',
    DIGITAL_TWIN_3D: 'DIGITAL_TWIN_3D'
};
const AVATAR_RENDER_MODES = Object.values(AvatarRenderMode);
const BASIC_AVATAR_TYPE = AvatarRenderMode.BASIC_2D;
const PREMIUM_AVATAR_TYPE = AvatarRenderMode.PREMIUM_PHOTOREALISTIC;
const DIGITAL_TWIN_3D_AVATAR_TYPE = AvatarRenderMode.DIGITAL_TWIN_3D;
const DEFAULT_AVATAR_TYPE = AvatarRenderMode.BASIC_2D;
const LEGACY_PROCEDURAL_AVATAR_TYPES = [
    'STYLIZED',
    'FASHION',
    'FITTING'
];
const AVATAR_TYPES = [
    ...AVATAR_RENDER_MODES,
    'BASIC',
    'PREMIUM',
    ...LEGACY_PROCEDURAL_AVATAR_TYPES
];
const LEGACY_AVATAR_TYPE_ALIASES = {
    BASIC: AvatarRenderMode.BASIC_2D,
    PREMIUM: AvatarRenderMode.PREMIUM_PHOTOREALISTIC
};

//# sourceMappingURL=digital-avatar.constants.js.map