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
    get BODY_TYPE_LIFESTYLE_BOOST () {
        return BODY_TYPE_LIFESTYLE_BOOST;
    },
    get BODY_TYPE_STYLE_BOOST () {
        return BODY_TYPE_STYLE_BOOST;
    },
    get DEFAULT_COLOR_AFFINITY () {
        return DEFAULT_COLOR_AFFINITY;
    },
    get MAX_SCORE () {
        return MAX_SCORE;
    },
    get MIN_SCORE () {
        return MIN_SCORE;
    },
    get SKIN_TONE_COLOR_MAP () {
        return SKIN_TONE_COLOR_MAP;
    }
});
const SKIN_TONE_COLOR_MAP = {
    FAIR: {
        navy: 0.9,
        pastels: 0.85,
        white: 0.8,
        black: 0.7,
        earth: 0.5
    },
    LIGHT: {
        navy: 0.85,
        pastels: 0.8,
        white: 0.75,
        black: 0.72,
        jewel: 0.7
    },
    MEDIUM: {
        earth: 0.9,
        olive: 0.85,
        white: 0.7,
        navy: 0.75,
        bright: 0.65
    },
    OLIVE: {
        earth: 0.88,
        olive: 0.9,
        burgundy: 0.8,
        navy: 0.78,
        gold: 0.72
    },
    TAN: {
        earth: 0.9,
        white: 0.75,
        coral: 0.82,
        navy: 0.7,
        gold: 0.78
    },
    BROWN: {
        jewel: 0.9,
        earth: 0.88,
        white: 0.72,
        gold: 0.85,
        bright: 0.68
    },
    DARK: {
        jewel: 0.92,
        white: 0.85,
        gold: 0.88,
        bright: 0.75,
        earth: 0.7
    }
};
const DEFAULT_COLOR_AFFINITY = {
    navy: 0.7,
    earth: 0.65,
    white: 0.6,
    black: 0.6,
    pastels: 0.55
};
const BODY_TYPE_STYLE_BOOST = {
    SLIM: 5,
    ATHLETIC: 10,
    AVERAGE: 0,
    CURVY: 5,
    PLUS_SIZE: 3
};
const BODY_TYPE_LIFESTYLE_BOOST = {
    SLIM: 5,
    ATHLETIC: 15,
    AVERAGE: 0,
    CURVY: 3,
    PLUS_SIZE: 2
};
const MIN_SCORE = 0;
const MAX_SCORE = 100;

//# sourceMappingURL=dna.constants.js.map