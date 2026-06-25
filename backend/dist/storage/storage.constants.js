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
    get AVATAR_OUTPUT_FORMATS () {
        return AVATAR_OUTPUT_FORMATS;
    },
    get AVATAR_PUBLIC_PREFIX () {
        return AVATAR_PUBLIC_PREFIX;
    },
    get AVATAR_STORAGE_FOLDER () {
        return AVATAR_STORAGE_FOLDER;
    },
    get AVATAR_STORAGE_KINDS () {
        return AVATAR_STORAGE_KINDS;
    },
    get BODY_PUBLIC_PREFIX () {
        return BODY_PUBLIC_PREFIX;
    },
    get BODY_STORAGE_FOLDER () {
        return BODY_STORAGE_FOLDER;
    },
    get DEFAULT_STORAGE_PROVIDER () {
        return DEFAULT_STORAGE_PROVIDER;
    },
    get FACE_PUBLIC_PREFIX () {
        return FACE_PUBLIC_PREFIX;
    },
    get FACE_STORAGE_FOLDER () {
        return FACE_STORAGE_FOLDER;
    },
    get STORAGE_PROVIDERS () {
        return STORAGE_PROVIDERS;
    },
    get USER_PNG_PUBLIC_PREFIX () {
        return USER_PNG_PUBLIC_PREFIX;
    },
    get USER_PNG_STORAGE_FOLDER () {
        return USER_PNG_STORAGE_FOLDER;
    }
});
const STORAGE_PROVIDERS = {
    LOCAL: 'local',
    S3: 's3',
    CLOUDINARY: 'cloudinary'
};
const DEFAULT_STORAGE_PROVIDER = STORAGE_PROVIDERS.LOCAL;
const AVATAR_STORAGE_FOLDER = 'avatars';
const AVATAR_PUBLIC_PREFIX = '/uploads/avatars';
const FACE_STORAGE_FOLDER = 'faces';
const FACE_PUBLIC_PREFIX = '/uploads/faces';
const BODY_STORAGE_FOLDER = 'body';
const BODY_PUBLIC_PREFIX = '/uploads/body';
const USER_PNG_STORAGE_FOLDER = 'user-png';
const USER_PNG_PUBLIC_PREFIX = '/uploads/user-png';
const AVATAR_OUTPUT_FORMATS = {
    IMAGE_2D: 'png',
    MESH_3D: 'glb',
    AR_MESH: 'usdz'
};
const AVATAR_STORAGE_KINDS = {
    IMAGE: 'image',
    MESH: 'mesh'
};

//# sourceMappingURL=storage.constants.js.map