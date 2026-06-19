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
        return DEFAULT_FACE_VECTOR_SIZE;
    },
    get DEFAULT_SIMILARITY_THRESHOLD () {
        return DEFAULT_SIMILARITY_THRESHOLD;
    },
    get FACE_COLLECTION () {
        return FACE_COLLECTION;
    }
});
const DEFAULT_FACE_VECTOR_SIZE = 512;
const DEFAULT_SIMILARITY_THRESHOLD = 0.85;
const FACE_COLLECTION = 'users_face_vectors';

//# sourceMappingURL=face.constants.js.map