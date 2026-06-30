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
    get AVATAR_GENERATION_STRATEGIES () {
        return AVATAR_GENERATION_STRATEGIES;
    },
    get resolveAvatarGenerationStrategy () {
        return resolveAvatarGenerationStrategy;
    }
});
const _digitalavatarconstants = require("../constants/digital-avatar.constants");
const _avatartypeutil = require("../utils/avatar-type.util");
const AVATAR_GENERATION_STRATEGIES = {
    [_digitalavatarconstants.AvatarRenderMode.BASIC_2D]: {
        canonicalType: _digitalavatarconstants.AvatarRenderMode.BASIC_2D,
        resolveAiType: ()=>'BASIC'
    },
    [_digitalavatarconstants.AvatarRenderMode.PREMIUM_PHOTOREALISTIC]: {
        canonicalType: _digitalavatarconstants.AvatarRenderMode.PREMIUM_PHOTOREALISTIC,
        resolveAiType: ()=>'PREMIUM'
    },
    [_digitalavatarconstants.AvatarRenderMode.DIGITAL_TWIN_3D]: {
        canonicalType: _digitalavatarconstants.AvatarRenderMode.DIGITAL_TWIN_3D,
        resolveAiType: ()=>'DIGITAL_TWIN_3D'
    }
};
function resolveAvatarGenerationStrategy(avatarType) {
    const canonicalType = (0, _avatartypeutil.normalizeAvatarType)(avatarType);
    const registered = AVATAR_GENERATION_STRATEGIES[canonicalType];
    if (registered) {
        return {
            ...registered,
            capabilities: (0, _avatartypeutil.getAvatarRenderCapabilities)(canonicalType),
            aiAvatarType: registered.resolveAiType()
        };
    }
    const proceduralType = String(avatarType || '').trim().toUpperCase();
    return {
        canonicalType: proceduralType,
        capabilities: (0, _avatartypeutil.getAvatarRenderCapabilities)(proceduralType),
        aiAvatarType: (0, _avatartypeutil.resolveAiAvatarType)(proceduralType),
        resolveAiType: ()=>(0, _avatartypeutil.resolveAiAvatarType)(proceduralType)
    };
}

//# sourceMappingURL=avatar-generation-strategy.registry.js.map