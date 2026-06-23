"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LocalStorageProvider", {
    enumerable: true,
    get: function() {
        return LocalStorageProvider;
    }
});
const _promises = require("fs/promises");
const _path = require("path");
const _storageconstants = require("../storage.constants");
const _storagepathutil = require("../utils/storage-path.util");
let LocalStorageProvider = class LocalStorageProvider {
    constructor(config = {}){
        this.rootDir = config.rootDir || 'uploads';
        this.publicPath = (config.publicPath || '/uploads').replace(/\/$/, '');
    }
    toStoragePath(objectKey) {
        const normalizedKey = objectKey.replace(/\\/g, '/').replace(/^\/+/, '');
        return `${this.publicPath}/${normalizedKey}`.replace(/\/+/g, '/');
    }
    async upload({ buffer, objectKey }) {
        const normalizedKey = objectKey.replace(/\\/g, '/').replace(/^\/+/, '');
        const storagePath = this.toStoragePath(normalizedKey);
        const absolutePath = (0, _storagepathutil.toFilesystemPath)(storagePath, this.rootDir);
        await (0, _promises.mkdir)((0, _path.dirname)(absolutePath), {
            recursive: true
        });
        await (0, _promises.writeFile)(absolutePath, buffer);
        return {
            storagePath,
            key: normalizedKey,
            provider: _storageconstants.DEFAULT_STORAGE_PROVIDER
        };
    }
    async deleteStoragePath(storagePath) {
        if (!storagePath) {
            return false;
        }
        const absolutePath = (0, _storagepathutil.toFilesystemPath)(storagePath, this.rootDir);
        try {
            await (0, _promises.unlink)(absolutePath);
            return true;
        } catch (error) {
            if (error?.code === 'ENOENT') {
                return false;
            }
            throw error;
        }
    }
    async deleteFolder(relativeFolder) {
        const normalizedFolder = relativeFolder.replace(/\\/g, '/').replace(/^\/+/, '');
        const absolutePath = (0, _path.join)(this.rootDir, normalizedFolder);
        try {
            await (0, _promises.rm)(absolutePath, {
                recursive: true,
                force: true
            });
            return true;
        } catch (error) {
            if (error?.code === 'ENOENT') {
                return false;
            }
            throw error;
        }
    }
};

//# sourceMappingURL=local-storage.provider.js.map