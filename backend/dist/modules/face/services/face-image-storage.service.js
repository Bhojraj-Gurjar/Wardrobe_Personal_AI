"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FaceImageStorageService", {
    enumerable: true,
    get: function() {
        return FaceImageStorageService;
    }
});
const _common = require("@nestjs/common");
const _storageservice = require("../../../storage/services/storage.service");
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
let FaceImageStorageService = class FaceImageStorageService {
    constructor(storageService){
        this.storageService = storageService;
        this.logger = new _common.Logger(FaceImageStorageService.name);
    }
    async replaceFaceImage(userId, buffer, mimeType, previousStoragePath = null) {
        const uploadResult = await this.storageService.uploadFaceImage({
            userId,
            buffer,
            mimeType
        });
        await this.storageService.deleteFolderFilesExcept(`faces/${userId}`, uploadResult.storagePath);
        if (previousStoragePath && previousStoragePath !== uploadResult.storagePath) {
            await this.storageService.deleteStoredFile(previousStoragePath);
        }
        this.logger.log(`Stored face image for user ${userId} at ${uploadResult.storagePath}`);
        return uploadResult.storagePath;
    }
    async readFaceImage(storagePath) {
        if (!storagePath) {
            return null;
        }
        return this.storageService.readStoredFile(storagePath);
    }
};
FaceImageStorageService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_storageservice.StorageService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], FaceImageStorageService);

//# sourceMappingURL=face-image-storage.service.js.map