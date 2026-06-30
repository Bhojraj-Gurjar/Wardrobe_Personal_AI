import {
  FACE_LIVENESS_CAPTURE_INTERVAL_MS,
  FACE_LIVENESS_DETECTION_INTERVAL_MS,
  FACE_LIVENESS_MAX_FRAMES,
  FACE_LIVENESS_MIN_FRAMES,
  FACE_LIVENESS_POSITION_STABLE_MS,
  FACE_LIVENESS_STABLE_FRAME_COUNT,
} from '@/features/face/constants/face-liveness-challenges';
import {
  FACE_IMAGE_JPEG_QUALITY,
  FACE_IMAGE_MAX_WIDTH,
} from '@/features/face/utils/prepare-face-image';

/** Shared capture settings — registration and login must stay identical. */
export const FACE_AUTH_CAPTURE_SETTINGS = {
  captureMaxWidth: FACE_IMAGE_MAX_WIDTH,
  captureQuality: FACE_IMAGE_JPEG_QUALITY,
  minFrames: FACE_LIVENESS_MIN_FRAMES,
  maxFrames: FACE_LIVENESS_MAX_FRAMES,
  captureIntervalMs: FACE_LIVENESS_CAPTURE_INTERVAL_MS,
  detectionIntervalMs: FACE_LIVENESS_DETECTION_INTERVAL_MS,
  positionStableMs: FACE_LIVENESS_POSITION_STABLE_MS,
  stableFrameCount: FACE_LIVENESS_STABLE_FRAME_COUNT,
};
