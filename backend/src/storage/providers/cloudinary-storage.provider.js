import { createHash } from 'crypto';
import { File } from 'node:buffer';
import { STORAGE_PROVIDERS } from '../storage.constants';

function normalizeObjectKey(objectKey) {
  return String(objectKey || '').replace(/\\/g, '/').replace(/^\/+/, '');
}

function storagePathFromObjectKey(objectKey) {
  const normalizedKey = normalizeObjectKey(objectKey);
  return `/uploads/${normalizedKey}`.replace(/\/+/g, '/');
}

function objectKeyFromStoragePath(storagePath) {
  return String(storagePath || '')
    .trim()
    .replace(/^\/uploads\//, '')
    .replace(/^\/+/, '');
}

function extensionFromObjectKey(objectKey) {
  const match = objectKey.match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() || 'jpg';
}

function mimeTypeFromObjectKey(objectKey) {
  const extension = extensionFromObjectKey(objectKey);

  if (extension === 'jpg' || extension === 'jpeg') {
    return 'image/jpeg';
  }

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'webp') {
    return 'image/webp';
  }

  if (extension === 'svg+xml') {
    return 'image/svg+xml';
  }

  if (extension === 'pdf') {
    return 'application/pdf';
  }

  return `image/${extension}`;
}

export class CloudinaryStorageProvider {
  constructor(config = {}) {
    this.cloudName = config.cloudName;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.folder = (config.folder || 'wardrobe-ai').replace(/\/$/, '');
    this.publicPath = (config.publicPath || '/uploads').replace(/\/$/, '');

    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error(
        'Cloudinary storage requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      );
    }
  }

  toStoragePath(objectKey) {
    return storagePathFromObjectKey(objectKey);
  }

  publicIdFromObjectKey(objectKey) {
    const normalizedKey = normalizeObjectKey(objectKey);
    const withoutExtension = normalizedKey.replace(/\.[^.]+$/, '');
    return `${this.folder}/${withoutExtension}`;
  }

  resolvePublicUrl(storagePath) {
    if (!storagePath) {
      return null;
    }

    if (/^https?:\/\//i.test(storagePath)) {
      return storagePath;
    }

    const objectKey = objectKeyFromStoragePath(storagePath);
    const publicId = this.publicIdFromObjectKey(objectKey);
    const extension = extensionFromObjectKey(objectKey);

    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${publicId}.${extension}`;
  }

  signParams(params) {
    const sorted = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    return createHash('sha1').update(`${sorted}${this.apiSecret}`).digest('hex');
  }

  async upload({ buffer, objectKey }) {
    const normalizedKey = normalizeObjectKey(objectKey);
    const publicId = this.publicIdFromObjectKey(normalizedKey);
    const timestamp = Math.round(Date.now() / 1000);
    const mimeType = mimeTypeFromObjectKey(normalizedKey);
    const params = {
      public_id: publicId,
      timestamp,
    };
    const signature = this.signParams(params);

    const form = new FormData();
    form.append(
      'file',
      new File([buffer], normalizedKey.split('/').pop() || 'upload.jpg', { type: mimeType }),
    );
    form.append('api_key', this.apiKey);
    form.append('timestamp', String(timestamp));
    form.append('public_id', publicId);
    form.append('signature', signature);
    form.append('overwrite', 'true');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      {
        method: 'POST',
        body: form,
      },
    );

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.error?.message || 'Cloudinary upload failed');
    }

    const storagePath = this.toStoragePath(normalizedKey);

    return {
      storagePath,
      key: normalizedKey,
      provider: STORAGE_PROVIDERS.CLOUDINARY,
      publicUrl: payload.secure_url || this.resolvePublicUrl(storagePath),
    };
  }

  async readStoragePath(storagePath) {
    const url = this.resolvePublicUrl(storagePath);

    if (!url) {
      return null;
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const objectKey = objectKeyFromStoragePath(storagePath);

      return {
        buffer,
        mimeType: mimeTypeFromObjectKey(objectKey),
      };
    } catch {
      return null;
    }
  }

  async storagePathExists(storagePath) {
    const url = this.resolvePublicUrl(storagePath);

    if (!url) {
      return false;
    }

    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  async deleteStoragePath(storagePath) {
    const objectKey = objectKeyFromStoragePath(storagePath);

    if (!objectKey) {
      return false;
    }

    const publicId = this.publicIdFromObjectKey(objectKey);
    const timestamp = Math.round(Date.now() / 1000);
    const params = {
      public_id: publicId,
      timestamp,
    };
    const signature = this.signParams(params);

    const body = new URLSearchParams({
      public_id: publicId,
      api_key: this.apiKey,
      timestamp: String(timestamp),
      signature,
    });

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`,
      {
        method: 'POST',
        body,
      },
    );

    if (!response.ok) {
      return false;
    }

    const payload = await response.json().catch(() => ({}));
    return payload.result === 'ok' || payload.result === 'not found';
  }

  async deleteFolder(relativeFolder) {
    const normalizedFolder = normalizeObjectKey(relativeFolder);
    const prefix = `${this.folder}/${normalizedFolder}`;
    const timestamp = Math.round(Date.now() / 1000);
    const params = {
      prefix,
      timestamp,
    };
    const signature = this.signParams(params);

    const body = new URLSearchParams({
      prefix,
      api_key: this.apiKey,
      timestamp: String(timestamp),
      signature,
    });

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/resources/image/upload?${body.toString()}`,
      {
        method: 'DELETE',
      },
    );

    return response.ok;
  }
}
