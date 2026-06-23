"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AvatarImageStorageService", {
    enumerable: true,
    get: function() {
        return AvatarImageStorageService;
    }
});
const _common = require("@nestjs/common");
const _storageservice = require("../../../storage/services/storage.service");
const _storagepathutil = require("../../../storage/utils/storage-path.util");
const _avatarimageutil = require("../utils/avatar-image.util");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let AvatarImageStorageService = class AvatarImageStorageService {
    constructor(storageService){
        this.storageService = storageService;
        this.logger = new _common.Logger(AvatarImageStorageService.name);
    }
    async resolveStoragePath(userId, version, imagePayload) {
        if (!imagePayload) {
            throw new _common.BadRequestException('Avatar image payload is required');
        }
        const trimmed = imagePayload.trim();
        if ((0, _storagepathutil.isStoredImagePath)(trimmed)) {
            return trimmed;
        }
        const parsed = (0, _storagepathutil.parseImagePayload)(trimmed);
        if (!parsed || parsed.kind !== 'buffer') {
            throw new _common.BadRequestException('Avatar image must be a storage path or a base64 data URL from the AI service');
        }
        const uploadResult = await this.storageService.uploadAvatarImage({
            userId,
            version,
            buffer: parsed.buffer,
            mimeType: parsed.mimeType
        });
        this.logger.log(`Stored avatar image for user ${userId} v${version} at ${uploadResult.storagePath}`);
        return uploadResult.storagePath;
    }
    async persistAvatarGeneration(userId, version, aiResponse) {
        const imagePayload = aiResponse?.avatarImageUrl || aiResponse?.avatarImage || null;
        const storagePath = await this.resolveStoragePath(userId, version, imagePayload);
        return {
            storagePath,
            rawAiResponse: (0, _avatarimageutil.sanitizeAiResponseForDatabase)(aiResponse, storagePath)
        };
    }
    async persistAvatarUpdate(userId, version, imagePayload, fallbackPath) {
        if (imagePayload === undefined) {
            return fallbackPath;
        }
        return this.resolveStoragePath(userId, version, imagePayload);
    }
};
AvatarImageStorageService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_storageservice.StorageService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], AvatarImageStorageService);

//# sourceMappingURL=avatar-image-storage.service.js.map