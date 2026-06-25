const IMAGE_FIELD = 'image';

export function toTryOnUploadDto(files) {
  const file = files?.[IMAGE_FIELD]?.[0] || files?.image?.[0];

  if (!file?.buffer?.length) {
    return null;
  }

  return {
    imageBuffer: file.buffer,
    imageMimeType: file.mimetype || 'image/jpeg',
  };
}
