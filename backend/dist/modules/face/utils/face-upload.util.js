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
    get FACE_LIVENESS_FRAMES_FIELD () {
        return FACE_LIVENESS_FRAMES_FIELD;
    },
    get FACE_MIN_LIVENESS_FRAMES () {
        return FACE_MIN_LIVENESS_FRAMES;
    },
    get FACE_UPLOAD_FIELD () {
        return FACE_UPLOAD_FIELD;
    },
    get FACE_UPLOAD_MAX_BYTES () {
        return FACE_UPLOAD_MAX_BYTES;
    },
    get toFaceAnalysisDto () {
        return toFaceAnalysisDto;
    },
    get toFaceAuthDto () {
        return toFaceAuthDto;
    },
    get toFaceEmbeddingDto () {
        return toFaceEmbeddingDto;
    }
});
const _common = require("@nestjs/common");
const _classtransformer = require("class-transformer");
const _classvalidator = require("class-validator");
const _faceembeddingdto = require("../dto/face-embedding.dto");
const FACE_UPLOAD_FIELD = 'frontFace';
const FACE_LIVENESS_FRAMES_FIELD = 'livenessFrames';
const FACE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
const FACE_MIN_LIVENESS_FRAMES = 2;
function readUploadedFile(file) {
    if (!file?.buffer?.length) {
        return null;
    }
    return {
        imageBuffer: file.buffer,
        imageMimeType: file.mimetype || 'image/jpeg'
    };
}
function collectFrameBuffers(files = {}) {
    const primary = files?.[FACE_UPLOAD_FIELD]?.[0];
    const extraFrames = files?.[FACE_LIVENESS_FRAMES_FIELD] || [];
    const buffers = [];
    const primaryFrame = readUploadedFile(primary);
    if (primaryFrame) {
        buffers.push(primaryFrame);
    }
    for (const frame of extraFrames){
        const parsed = readUploadedFile(frame);
        if (parsed) {
            buffers.push(parsed);
        }
    }
    return buffers;
}
async function toFaceAuthDto(files = {}, body = {}, options = {}) {
    const { requireLiveness = true, allowLegacyJson = false } = options;
    const frameBuffers = collectFrameBuffers(files);
    const challengeType = body.challengeType || body.challenge_type || null;
    const captureSessionId = body.captureSessionId || body.capture_session_id || null;
    if (frameBuffers.length > 0) {
        if (requireLiveness) {
            if (!challengeType) {
                throw new _common.BadRequestException('Liveness challenge required.');
            }
            if (frameBuffers.length < FACE_MIN_LIVENESS_FRAMES) {
                throw new _common.BadRequestException(`Provide at least ${FACE_MIN_LIVENESS_FRAMES} live camera frames.`);
            }
        }
        const primary = frameBuffers[0];
        return {
            imageBuffer: primary.imageBuffer,
            imageMimeType: primary.imageMimeType,
            livenessFrames: frameBuffers,
            challengeType,
            captureSessionId
        };
    }
    if (requireLiveness && !allowLegacyJson) {
        throw new _common.BadRequestException('Live camera capture required. Image uploads are not allowed.');
    }
    const legacyFile = files?.[FACE_UPLOAD_FIELD]?.[0] || files?.frontFace?.[0];
    const legacyFrame = readUploadedFile(legacyFile);
    if (legacyFrame) {
        return legacyFrame;
    }
    const dto = (0, _classtransformer.plainToInstance)(_faceembeddingdto.FaceEmbeddingDto, body, {
        enableImplicitConversion: true
    });
    const errors = await (0, _classvalidator.validate)(dto, {
        whitelist: true,
        forbidNonWhitelisted: true
    });
    if (errors.length > 0) {
        const messages = errors.flatMap((error)=>Object.values(error.constraints || {}));
        throw new _common.BadRequestException(messages);
    }
    if (!dto.image) {
        throw new _common.BadRequestException('Provide a frontFace image upload.');
    }
    if (requireLiveness && !allowLegacyJson) {
        throw new _common.BadRequestException('Live camera capture required. Image uploads are not allowed.');
    }
    return dto;
}
async function toFaceAnalysisDto(files = {}, body = {}) {
    return toFaceAuthDto(files, body, {
        requireLiveness: false,
        allowLegacyJson: true
    });
}
const toFaceEmbeddingDto = toFaceAuthDto;

//# sourceMappingURL=face-upload.util.js.map