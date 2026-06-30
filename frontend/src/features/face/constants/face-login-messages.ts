import { FaceLoginError, FaceLoginState } from '@/features/face/types/face-login.types';

/** User-visible copy for each failure type (no hardcoded strings in components). */
export const FACE_LOGIN_ERROR_MESSAGES: Record<FaceLoginError, string> = {
  [FaceLoginError.CAMERA_PERMISSION_DENIED]:
    'Camera permission denied. Please allow camera access and try again.',
  [FaceLoginError.CAMERA_NOT_FOUND]:
    'No camera detected on this device.',
  [FaceLoginError.CAMERA_UNAVAILABLE]:
    'Camera preview is not ready. Please try again.',
  [FaceLoginError.FACE_NOT_DETECTED]:
    'Move your face inside the camera frame.',
  [FaceLoginError.MULTIPLE_FACES]:
    'Multiple faces detected. Please ensure only one person is visible.',
  [FaceLoginError.FACE_TOO_FAR]:
    'Move closer to the camera.',
  [FaceLoginError.FACE_TOO_CLOSE]:
    'Move slightly back.',
  [FaceLoginError.POOR_LIGHTING]:
    'Lighting is too low. Move to a brighter area.',
  [FaceLoginError.NETWORK_ERROR]:
    'Network timeout. Check your connection and try again.',
  [FaceLoginError.BACKEND_ERROR]:
    'Authentication service is temporarily unavailable.',
  [FaceLoginError.TIMEOUT]:
    "We couldn't capture a clear face. Please ensure good lighting and look directly at the camera.",
  [FaceLoginError.FACE_NOT_RECOGNIZED]:
    'Face mismatch. Please try again or login with password.',
  [FaceLoginError.CAPTURE_FAILED]:
    'Hold still for a second while we capture your face.',
  [FaceLoginError.LIVENESS_FAILED]:
    'Liveness verification failed. Please try again in good lighting.',
  [FaceLoginError.RATE_LIMITED]:
    'Too many failed face login attempts. Please try again later.',
  [FaceLoginError.UNKNOWN]:
    'Something went wrong. Please try again.',
};

/** Short labels for the step-by-step status list. */
export const FACE_LOGIN_STATUS_LABELS = {
  startingCamera: 'Starting camera…',
  detectingFace: 'Detecting face…',
  verifyingLiveness: 'Verifying liveness…',
  matchingIdentity: 'Matching identity…',
  signingIn: 'Signing you in…',
} as const;

/** In-progress copy keyed by state (never an infinite generic spinner). */
export const FACE_LOGIN_STATE_PROGRESS: Partial<Record<FaceLoginState, string>> = {
  [FaceLoginState.INITIALIZING_CAMERA]: 'Starting camera…',
  [FaceLoginState.CAMERA_READY]: 'Starting camera…',
  [FaceLoginState.DETECTING_FACE]: 'Detecting face…',
  [FaceLoginState.CAPTURING_FACE]: 'Verifying liveness…',
  [FaceLoginState.SENDING_REQUEST]: 'Matching identity…',
  [FaceLoginState.VERIFYING_IDENTITY]: 'Matching identity…',
  [FaceLoginState.SUCCESS]: 'Signing you in…',
};

export const FACE_LOGIN_VERIFY_TIMEOUT_MS = 30_000;

export const FACE_LOGIN_FACE_DETECT_TIMEOUT_MS = 3_000;

export const FACE_LOGIN_FACE_DETECT_INTERVAL_MS = 40;

/** Stable face required before capture (ms) — fallback when positioning is used. */
export const FACE_LOGIN_STABLE_FACE_MS = 200;

export const FACE_LOGIN_NETWORK_RETRY_MS = 3_000;

export const FACE_LOGIN_NETWORK_MAX_RETRIES = 2;

export function getFaceLoginErrorMessage(error: FaceLoginError | null | undefined): string {
  if (!error) {
    return FACE_LOGIN_ERROR_MESSAGES[FaceLoginError.UNKNOWN];
  }

  return FACE_LOGIN_ERROR_MESSAGES[error] ?? FACE_LOGIN_ERROR_MESSAGES[FaceLoginError.UNKNOWN];
}
