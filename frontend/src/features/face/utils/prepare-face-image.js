import { logFaceStep } from '@/features/face/utils/face-flow-log';

export const FACE_IMAGE_MAX_WIDTH = 960;
export const FACE_IMAGE_JPEG_QUALITY = 0.92;

export function compressCanvasToBlob(
  canvas,
  maxWidth = FACE_IMAGE_MAX_WIDTH,
  quality = FACE_IMAGE_JPEG_QUALITY,
) {
  const srcWidth = canvas.width;
  const srcHeight = canvas.height;

  if (!srcWidth || !srcHeight) {
    return Promise.resolve(null);
  }

  const width = Math.min(srcWidth, maxWidth);
  const height = Math.round((srcHeight / srcWidth) * width);
  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;

  const ctx = output.getContext('2d');
  ctx.drawImage(canvas, 0, 0, width, height);

  return new Promise((resolve) => {
    output.toBlob(
      (blob) => resolve(blob),
      'image/jpeg',
      quality,
    );
  });
}

export async function captureCompressedFaceBlob(
  video,
  { maxWidth = FACE_IMAGE_MAX_WIDTH, quality = FACE_IMAGE_JPEG_QUALITY } = {},
) {
  const width = video.videoWidth || maxWidth;
  const height = video.videoHeight || 480;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, width, height);

  const blob = await compressCanvasToBlob(canvas, maxWidth, quality);
  if (!blob) return null;

  logFaceStep(2, `image captured (${width}x${height})`);
  logFaceStep(3, `image compressed (${blob.size} bytes)`);

  return new File([blob], 'front-face.jpg', {
    type: 'image/jpeg',
  });
}

/** Laplacian variance proxy for sharpness (higher = sharper). */
export function measureFrameSharpness(video) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) {
    return 0;
  }

  const sampleWidth = Math.min(320, width);
  const sampleHeight = Math.round((height / width) * sampleWidth);
  const canvas = document.createElement('canvas');
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return 0;
  }

  ctx.drawImage(video, 0, 0, sampleWidth, sampleHeight);
  const { data } = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
  const gray = new Float32Array(sampleWidth * sampleHeight);

  for (let index = 0, pixel = 0; index < data.length; index += 4, pixel += 1) {
    gray[pixel] = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
  }

  let variance = 0;
  const laplacian = new Float32Array(sampleWidth * sampleHeight);

  for (let y = 1; y < sampleHeight - 1; y += 1) {
    for (let x = 1; x < sampleWidth - 1; x += 1) {
      const index = y * sampleWidth + x;
      const value =
        -4 * gray[index]
        + gray[index - 1]
        + gray[index + 1]
        + gray[index - sampleWidth]
        + gray[index + sampleWidth];
      laplacian[index] = value;
      variance += value * value;
    }
  }

  const samples = Math.max((sampleWidth - 2) * (sampleHeight - 2), 1);
  return variance / samples;
}
