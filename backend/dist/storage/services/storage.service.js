"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "StorageService", {
    enumerable: true,
    get: function() {
        return StorageService;
    }
});
const _common = require("@nestjs/common");
const _promises = require("fs/promises");
const _path = require("path");
const _config = require("@nestjs/config");
const _storageconstants = require("../storage.constants");
const _storagepathutil = require("../utils/storage-path.util");
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
let StorageService = class StorageService {
    constructor(configService){
        this.configService = configService;
        this.logger = new _common.Logger(StorageService.name);
        this.provider = (0, _storagepathutil.createStorageProvider)(configService.get('storage.provider'), {
            local: configService.get('storage.local')
        });
        this.logger.log('Avatar storage provider: local filesystem');
    }
    getProviderName() {
        return this.configService.get('storage.provider') || _storageconstants.DEFAULT_STORAGE_PROVIDER;
    }
    getPublicBaseUrl() {
        return this.configService.get('storage.local.publicBaseUrl');
    }
    async uploadAvatarImage({ userId, version, buffer, mimeType }) {
        const extension = (0, _storagepathutil.extensionFromMimeType)(mimeType);
        const objectKey = (0, _storagepathutil.buildAvatarObjectKey)(userId, version, extension);
        return this.provider.upload({
            buffer,
            mimeType,
            objectKey
        });
    }
    async uploadFaceImage({ userId, buffer, mimeType }) {
        const extension = (0, _storagepathutil.extensionFromMimeType)(mimeType);
        const objectKey = (0, _storagepathutil.buildFaceObjectKey)(userId, extension);
        return this.provider.upload({
            buffer,
            mimeType,
            objectKey
        });
    }
    async uploadBodyImage({ userId, buffer, mimeType }) {
        const extension = (0, _storagepathutil.extensionFromMimeType)(mimeType);
        const objectKey = (0, _storagepathutil.buildBodyObjectKey)(userId, extension);
        return this.provider.upload({
            buffer,
            mimeType,
            objectKey
        });
    }
    async deleteStoredFile(storagePath) {
        return this.provider.deleteStoragePath(storagePath);
    }
    async readStoredFile(storagePath) {
        if (!storagePath) {
            return null;
        }
        const rootDir = this.configService.get('storage.local.rootDir') || 'uploads';
        const absolutePath = (0, _storagepathutil.toFilesystemPath)(storagePath, rootDir);
        const extension = (0, _path.extname)(absolutePath).replace('.', '') || 'jpg';
        const buffer = await (0, _promises.readFile)(absolutePath);
        return {
            buffer,
            mimeType: (0, _storagepathutil.mimeTypeFromExtension)(extension)
        };
    }
    async deleteFaceImagesForUser(userId) {
        return this.provider.deleteFolder(`${_storageconstants.FACE_STORAGE_FOLDER}/${userId}`);
    }
    async deleteBodyImagesForUser(userId) {
        return this.provider.deleteFolder(`${_storageconstants.BODY_STORAGE_FOLDER}/${userId}`);
    }
    async findBodyImageForUser(userId) {
        const rootDir = this.configService.get('storage.local.rootDir') || 'uploads';
        const folderPath = (0, _path.join)(rootDir, _storageconstants.BODY_STORAGE_FOLDER, userId);
        try {
            const files = await (0, _promises.readdir)(folderPath);
            const match = files.find((file)=>/^body\./i.test(file));
            if (!match) {
                return null;
            }
            return `${_storageconstants.BODY_PUBLIC_PREFIX}/${userId}/${match}`.replace(/\/+/g, '/');
        } catch (error) {
            if (error?.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }
};
StorageService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_config.ConfigService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], StorageService);

//# sourceMappingURL=storage.service.js.map