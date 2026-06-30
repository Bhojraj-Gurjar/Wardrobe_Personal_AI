import {
  BODY_UPLOAD_ACCEPT,
  BODY_UPLOAD_MAX_BYTES,
  BODY_UPLOAD_MIN_HEIGHT,
  BODY_UPLOAD_MIN_WIDTH,
  FULL_BODY_VALIDATION_ERROR,
} from '../constants/body-upload.constants';

const ALLOWED_MIME = new Set(BODY_UPLOAD_ACCEPT.split(',').map((entry) => entry.trim()));
const MIN_KEYPOINT_SCORE = 0.35;
const MIN_BODY_SPAN_RATIO = 0.52;
const MIN_ANKLE_MARGIN_RATIO = 0.04;
const MIN_BRIGHTNESS = 28;
const MIN_SHARPNESS = 12;

const REQUIRED_KEYPOINTS = [
  'nose',
  'left_eye',
  'right_eye',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
];

let poseDetectorPromise = null;

function resolveExtension(fileName = '') {
  const match = String(fileName).toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] || '';
}

export function validateBodyImageFile(file) {
  if (!file) {
    return { ok: false, error: 'No image selected.' };
  }

  if (file.size > BODY_UPLOAD_MAX_BYTES) {
    return { ok: false, error: 'Image is too large. Maximum size is 10 MB.' };
  }

  const mime = String(file.type || '').toLowerCase();
  const extension = resolveExtension(file.name);

  if (!ALLOWED_MIME.has(mime) && !['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
    return { ok: false, error: 'Unsupported format. Upload a JPG, PNG, or WEBP image.' };
  }

  return { ok: true };
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image. The file may be corrupted.'));
    };

    image.src = url;
  });
}

function measureImageSharpness(image) {
  const sampleWidth = Math.min(320, image.naturalWidth);
  const sampleHeight = Math.max(1, Math.round((image.naturalHeight / image.naturalWidth) * sampleWidth));
  const canvas = document.createElement('canvas');
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return MIN_SHARPNESS;
  }

  ctx.drawImage(image, 0, 0, sampleWidth, sampleHeight);
  const { data } = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
  const gray = new Float32Array(sampleWidth * sampleHeight);

  for (let index = 0, pixel = 0; index < data.length; index += 4, pixel += 1) {
    gray[pixel] = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
  }

  let variance = 0;
  for (let y = 1; y < sampleHeight - 1; y += 1) {
    for (let x = 1; x < sampleWidth - 1; x += 1) {
      const index = y * sampleWidth + x;
      const value =
        -4 * gray[index]
        + gray[index - 1]
        + gray[index + 1]
        + gray[index - sampleWidth]
        + gray[index + sampleWidth];
      variance += value * value;
    }
  }

  const samples = Math.max((sampleWidth - 2) * (sampleHeight - 2), 1);
  return variance / samples;
}

function measureImageBrightness(image) {
  const sampleWidth = Math.min(160, image.naturalWidth);
  const sampleHeight = Math.max(1, Math.round((image.naturalHeight / image.naturalWidth) * sampleWidth));
  const canvas = document.createElement('canvas');
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return MIN_BRIGHTNESS;
  }

  ctx.drawImage(image, 0, 0, sampleWidth, sampleHeight);
  const { data } = ctx.getImageData(0, 0, sampleWidth, sampleHeight);

  let luminanceSum = 0;
  const pixelCount = data.length / 4;

  for (let index = 0; index < data.length; index += 4) {
    luminanceSum += 0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2];
  }

  return luminanceSum / pixelCount;
}

async function getPoseDetector() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!poseDetectorPromise) {
    poseDetectorPromise = (async () => {
      const tf = await import('@tensorflow/tfjs-core');
      await import('@tensorflow/tfjs-backend-webgl');
      await tf.setBackend('webgl');
      await tf.ready();

      const poseDetection = await import('@tensorflow-models/pose-detection');
      return poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING },
      );
    })().catch((error) => {
      poseDetectorPromise = null;
      throw error;
    });
  }

  return poseDetectorPromise;
}

function keypointMap(keypoints = []) {
  return keypoints.reduce((map, point) => {
    if (point?.name) {
      map[point.name] = point;
    }
    return map;
  }, {});
}

function validatePoseLandmarks(keypoints, imageWidth, imageHeight) {
  const points = keypointMap(keypoints);

  for (const name of REQUIRED_KEYPOINTS) {
    const point = points[name];
    if (!point || (point.score ?? 0) < MIN_KEYPOINT_SCORE) {
      return false;
    }
  }

  const nose = points.nose;
  const leftAnkle = points.left_ankle;
  const rightAnkle = points.right_ankle;
  const ankleY = (leftAnkle.y + rightAnkle.y) / 2;
  const bodySpan = ankleY - nose.y;

  if (bodySpan < imageHeight * MIN_BODY_SPAN_RATIO) {
    return false;
  }

  if (nose.y < imageHeight * 0.05) {
    return false;
  }

  const ankleMargin = imageHeight * MIN_ANKLE_MARGIN_RATIO;
  if (leftAnkle.y > imageHeight - ankleMargin || rightAnkle.y > imageHeight - ankleMargin) {
    return false;
  }

  const shoulderWidth = Math.abs(points.left_shoulder.x - points.right_shoulder.x);
  const hipWidth = Math.abs(points.left_hip.x - points.right_hip.x);

  if (shoulderWidth < imageWidth * 0.08 || hipWidth < imageWidth * 0.06) {
    return false;
  }

  return true;
}

export async function validateFullBodyImage(file) {
  const fileValidation = validateBodyImageFile(file);
  if (!fileValidation.ok) {
    return fileValidation;
  }

  let image;

  try {
    image = await loadImageFromFile(file);
  } catch (error) {
    return { ok: false, error: error?.message || 'Could not read image. The file may be corrupted.' };
  }

  const { naturalWidth: width, naturalHeight: height } = image;

  if (width < BODY_UPLOAD_MIN_WIDTH || height < BODY_UPLOAD_MIN_HEIGHT) {
    return {
      ok: false,
      error: `Image resolution is too low. Minimum size is ${BODY_UPLOAD_MIN_WIDTH}×${BODY_UPLOAD_MIN_HEIGHT}px.`,
    };
  }

  const brightness = measureImageBrightness(image);
  if (brightness < MIN_BRIGHTNESS) {
    return { ok: false, error: FULL_BODY_VALIDATION_ERROR };
  }

  const sharpness = measureImageSharpness(image);
  if (sharpness < MIN_SHARPNESS) {
    return { ok: false, error: FULL_BODY_VALIDATION_ERROR };
  }

  try {
    const detector = await getPoseDetector();
    if (!detector) {
      return { ok: false, error: 'Body validation is unavailable in this environment.' };
    }

    const poses = await detector.estimatePoses(image, {
      maxPoses: 1,
      flipHorizontal: false,
    });

    if (!poses?.length || !poses[0]?.keypoints?.length) {
      return { ok: false, error: FULL_BODY_VALIDATION_ERROR };
    }

    if (!validatePoseLandmarks(poses[0].keypoints, width, height)) {
      return { ok: false, error: FULL_BODY_VALIDATION_ERROR };
    }

    return { ok: true, width, height };
  } catch {
    return { ok: false, error: FULL_BODY_VALIDATION_ERROR };
  }
}
