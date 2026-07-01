"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BodyImageStorageService", {
    enumerable: true,
    get: function() {
        return BodyImageStorageService;
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
let BodyImageStorageService = class BodyImageStorageService {
    constructor(storageService){
        this.storageService = storageService;
        this.logger = new _common.Logger(BodyImageStorageService.name);
    }
    async replaceBodyImage(userId, buffer, mimeType, previousStoragePath = null) {
        const uploadResult = await this.storageService.uploadBodyImage({
            userId,
            buffer,
            mimeType
        });
        await this.storageService.deleteFolderFilesExcept(`body/${userId}`, uploadResult.storagePath);
        if (previousStoragePath && previousStoragePath !== uploadResult.storagePath) {
            await this.storageService.deleteStoredFile(previousStoragePath);
        }
        this.logger.log(`Stored body image for user ${userId} at ${uploadResult.storagePath}`);
        return uploadResult.storagePath;
    }
    findStoredBodyImagePath(userId) {
        return this.storageService.findBodyImageForUser(userId);
    }
    async readBodyImage(storagePath) {
        if (!storagePath) {
            return null;
        }
        return this.storageService.readStoredFile(storagePath);
    }
    async bodyImageExists(storagePath) {
        if (!storagePath) {
            return false;
        }
        return this.storageService.storedFileExists(storagePath);
    }
};
BodyImageStorageService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_storageservice.StorageService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], BodyImageStorageService);

//# sourceMappingURL=body-image-storage.service.js.map