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
    get DEFAULT_FACE_VECTOR_SIZE () {
        return _faceconstants.DEFAULT_FACE_VECTOR_SIZE;
    },
    get DEFAULT_SIMILARITY_THRESHOLD () {
        return _faceconstants.DEFAULT_SIMILARITY_THRESHOLD;
    },
    get FACE_COLLECTION () {
        return _faceconstants.FACE_COLLECTION;
    }
});
const _faceconstants = require("./face.constants");

//# sourceMappingURL=index.js.map