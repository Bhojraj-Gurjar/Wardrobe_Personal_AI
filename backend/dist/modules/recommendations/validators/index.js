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
    get DEFAULT_LIMIT () {
        return _recommendationconstants.DEFAULT_LIMIT;
    },
    get MAX_LIMIT () {
        return _recommendationconstants.MAX_LIMIT;
    },
    get RECOMMENDATION_FACTORS () {
        return _recommendationconstants.RECOMMENDATION_FACTORS;
    },
    get RECOMMENDATION_SOURCES () {
        return _recommendationconstants.RECOMMENDATION_SOURCES;
    }
});
const _recommendationconstants = require("./recommendation.constants");

//# sourceMappingURL=index.js.map