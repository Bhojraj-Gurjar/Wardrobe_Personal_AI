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
    get MAX_SCORE () {
        return MAX_SCORE;
    },
    get MIN_SCORE () {
        return MIN_SCORE;
    },
    get ONBOARDING_INPUT_FIELDS () {
        return ONBOARDING_INPUT_FIELDS;
    }
});
const MIN_SCORE = 0;
const MAX_SCORE = 100;
const ONBOARDING_INPUT_FIELDS = [
    'gender',
    'age',
    'height',
    'weight',
    'country',
    'language',
    'occupation',
    'shopping_frequency',
    'budget_preference',
    'preferred_categories',
    'favorite_colors'
];

//# sourceMappingURL=dna.constants.js.map