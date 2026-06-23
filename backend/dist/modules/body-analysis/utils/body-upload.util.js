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
    get BODY_IMAGE_ALIAS_FIELD () {
        return BODY_IMAGE_ALIAS_FIELD;
    },
    get BODY_IMAGE_FIELD () {
        return BODY_IMAGE_FIELD;
    },
    get BODY_UPLOAD_MAX_BYTES () {
        return BODY_UPLOAD_MAX_BYTES;
    },
    get BODY_VIDEO_FIELD () {
        return BODY_VIDEO_FIELD;
    },
    get BODY_VIDEO_MAX_BYTES () {
        return BODY_VIDEO_MAX_BYTES;
    },
    get toBodyAnalysisDto () {
        return toBodyAnalysisDto;
    }
});
const BODY_IMAGE_FIELD = 'image';
const BODY_VIDEO_FIELD = 'video';
const BODY_IMAGE_ALIAS_FIELD = 'bodyImage';
const BODY_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
const BODY_VIDEO_MAX_BYTES = 100 * 1024 * 1024;
function toBodyAnalysisDto(files = {}, body = {}) {
    const imageFile = files.image?.[0] || files.bodyImage?.[0];
    const videoFile = files.video?.[0];
    const height = body.height !== undefined && body.height !== '' ? Number(body.height) : null;
    return {
        imageBuffer: imageFile?.buffer?.length ? imageFile.buffer : null,
        imageMimeType: imageFile?.mimetype || 'image/jpeg',
        videoBuffer: videoFile?.buffer?.length ? videoFile.buffer : null,
        videoMimeType: videoFile?.mimetype || null,
        height: Number.isFinite(height) && height > 0 ? height : null
    };
}

//# sourceMappingURL=body-upload.util.js.map