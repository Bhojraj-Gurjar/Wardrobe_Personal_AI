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
    get FACE_UPLOAD_FIELD () {
        return FACE_UPLOAD_FIELD;
    },
    get FACE_UPLOAD_MAX_BYTES () {
        return FACE_UPLOAD_MAX_BYTES;
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
const FACE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
async function toFaceAuthDto(file, body = {}) {
    if (file?.buffer?.length) {
        return {
            imageBuffer: file.buffer,
            imageMimeType: file.mimetype || 'image/jpeg'
        };
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
    return dto;
}
const toFaceEmbeddingDto = toFaceAuthDto;

//# sourceMappingURL=face-upload.util.js.map