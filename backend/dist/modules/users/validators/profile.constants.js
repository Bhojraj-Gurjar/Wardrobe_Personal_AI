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
    get BODY_TYPE () {
        return BODY_TYPE;
    },
    get BODY_TYPE_VALUES () {
        return BODY_TYPE_VALUES;
    },
    get GENDER () {
        return GENDER;
    },
    get GENDER_VALUES () {
        return GENDER_VALUES;
    },
    get SKIN_TONE () {
        return SKIN_TONE;
    },
    get SKIN_TONE_VALUES () {
        return SKIN_TONE_VALUES;
    }
});
const GENDER = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHER: 'OTHER',
    PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY'
};
const BODY_TYPE = {
    SLIM: 'SLIM',
    ATHLETIC: 'ATHLETIC',
    AVERAGE: 'AVERAGE',
    CURVY: 'CURVY',
    PLUS_SIZE: 'PLUS_SIZE'
};
const SKIN_TONE = {
    FAIR: 'FAIR',
    LIGHT: 'LIGHT',
    MEDIUM: 'MEDIUM',
    OLIVE: 'OLIVE',
    TAN: 'TAN',
    BROWN: 'BROWN',
    DARK: 'DARK'
};
const GENDER_VALUES = Object.values(GENDER);
const BODY_TYPE_VALUES = Object.values(BODY_TYPE);
const SKIN_TONE_VALUES = Object.values(SKIN_TONE);

//# sourceMappingURL=profile.constants.js.map