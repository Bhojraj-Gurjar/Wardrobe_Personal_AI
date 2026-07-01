import { access, mkdir, readFile, writeFile, readdir, unlink, rm } from 'fs/promises';
import { dirname, join } from 'path';
import { DEFAULT_STORAGE_PROVIDER } from '../storage.constants';
import { toFilesystemPath } from '../utils/storage-path.util';

export class LocalStorageProvider {
  constructor(config = {}) {
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
    const absolutePath = toFilesystemPath(storagePath, this.rootDir);

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);

    return {
      storagePath,
      key: normalizedKey,
      provider: DEFAULT_STORAGE_PROVIDER,
    };
  }

  async deleteStoragePath(storagePath) {
    if (!storagePath) {
      return false;
    }

    const absolutePath = toFilesystemPath(storagePath, this.rootDir);

    try {
      await unlink(absolutePath);
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
    const absolutePath = join(this.rootDir, normalizedFolder);

    try {
      await rm(absolutePath, { recursive: true, force: true });
      return true;
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return false;
      }

      throw error;
    }
  }

  resolvePublicUrl() {
    return null;
  }

  async readStoragePath(storagePath) {
    if (!storagePath) {
      return null;
    }

    const absolutePath = toFilesystemPath(storagePath, this.rootDir);
    const extension = absolutePath.split('.').pop()?.replace('jpeg', 'jpg') || 'jpg';

    try {
      const buffer = await readFile(absolutePath);

      return {
        buffer,
        mimeType: extension === 'jpg' ? 'image/jpeg' : `image/${extension}`,
      };
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return null;
      }

      throw error;
    }
  }

  async storagePathExists(storagePath) {
    if (!storagePath) {
      return false;
    }

    const absolutePath = toFilesystemPath(storagePath, this.rootDir);

    try {
      await access(absolutePath);
      return true;
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return false;
      }

      throw error;
    }
  }
}
