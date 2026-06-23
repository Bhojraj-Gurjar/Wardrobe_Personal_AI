export const BODY_IMAGE_FIELD = 'image';
export const BODY_VIDEO_FIELD = 'video';
export const BODY_IMAGE_ALIAS_FIELD = 'bodyImage';
export const BODY_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const BODY_VIDEO_MAX_BYTES = 100 * 1024 * 1024;

export function toBodyAnalysisDto(files = {}, body = {}) {
  const imageFile = files.image?.[0] || files.bodyImage?.[0];
  const videoFile = files.video?.[0];

  const height = body.height !== undefined && body.height !== ''
    ? Number(body.height)
    : null;

  return {
    imageBuffer: imageFile?.buffer?.length ? imageFile.buffer : null,
    imageMimeType: imageFile?.mimetype || 'image/jpeg',
    videoBuffer: videoFile?.buffer?.length ? videoFile.buffer : null,
    videoMimeType: videoFile?.mimetype || null,
    height: Number.isFinite(height) && height > 0 ? height : null,
  };
}
