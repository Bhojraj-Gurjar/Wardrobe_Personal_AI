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
    get BMI_CATEGORY () {
        return BMI_CATEGORY;
    },
    get BODY_TYPE_LIFESTYLE_HINT () {
        return BODY_TYPE_LIFESTYLE_HINT;
    },
    get BODY_TYPE_STYLE_FIT () {
        return BODY_TYPE_STYLE_FIT;
    },
    get SKIN_TONE_COLOR_MAP () {
        return SKIN_TONE_COLOR_MAP;
    }
});
const SKIN_TONE_COLOR_MAP = {
    FAIR: [
        'pastel blue',
        'soft pink',
        'lavender',
        'ivory'
    ],
    LIGHT: [
        'navy',
        'emerald',
        'burgundy',
        'cream'
    ],
    MEDIUM: [
        'navy',
        'white',
        'olive',
        'coral'
    ],
    OLIVE: [
        'earth tones',
        'rust',
        'teal',
        'khaki'
    ],
    TAN: [
        'white',
        'gold',
        'turquoise',
        'coral'
    ],
    BROWN: [
        'jewel tones',
        'gold',
        'cream',
        'copper'
    ],
    DARK: [
        'white',
        'bold colors',
        'metallics',
        'royal blue'
    ]
};
const BODY_TYPE_STYLE_FIT = {
    SLIM: 'fitted',
    ATHLETIC: 'sporty',
    AVERAGE: 'balanced',
    MUSCULAR: 'structured',
    'Plus Size': 'relaxed',
    PLUS_SIZE: 'relaxed'
};
const BODY_TYPE_LIFESTYLE_HINT = {
    SLIM: 'streamlined_layers',
    ATHLETIC: 'performance_casual',
    AVERAGE: 'versatile_classics',
    MUSCULAR: 'defined_silhouette',
    'Plus Size': 'comfort_forward',
    PLUS_SIZE: 'comfort_forward'
};
const BMI_CATEGORY = {
    UNDERWEIGHT: 'underweight',
    NORMAL: 'normal',
    OVERWEIGHT: 'overweight',
    OBESE: 'obese'
};

//# sourceMappingURL=body-analysis.constants.js.map