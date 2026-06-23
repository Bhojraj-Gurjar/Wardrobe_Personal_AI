export const STORAGE_PROVIDERS = {
  LOCAL: 'local',
  S3: 's3',
  CLOUDINARY: 'cloudinary',
};

export const DEFAULT_STORAGE_PROVIDER = STORAGE_PROVIDERS.LOCAL;

export const AVATAR_STORAGE_FOLDER = 'avatars';

export const AVATAR_PUBLIC_PREFIX = '/uploads/avatars';

export const FACE_STORAGE_FOLDER = 'faces';

export const FACE_PUBLIC_PREFIX = '/uploads/faces';

export const BODY_STORAGE_FOLDER = 'body';

export const BODY_PUBLIC_PREFIX = '/uploads/body';

/** Future 3D twin assets will use mesh formats instead of raster images. */
export const AVATAR_OUTPUT_FORMATS = {
  IMAGE_2D: 'png',
  MESH_3D: 'glb',
  AR_MESH: 'usdz',
};

export const AVATAR_STORAGE_KINDS = {
  IMAGE: 'image',
  MESH: 'mesh',
};
