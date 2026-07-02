import { FaceLoginState } from '@/features/face/types/face-login.types';

/**
 * Maps internal face-login states to a single user-facing status line.
 * UI-only — does not affect the underlying flow.
 */
export function getFaceLoginSimpleStatus(state) {
  switch (state) {
    case FaceLoginState.CAPTURING_FACE:
    case FaceLoginState.SENDING_REQUEST:
    case FaceLoginState.VERIFYING_IDENTITY:
    case FaceLoginState.SUCCESS:
      return 'Verifying...';
    case FaceLoginState.FAILED:
      return null;
    case FaceLoginState.IDLE:
    case FaceLoginState.INITIALIZING_CAMERA:
    case FaceLoginState.CAMERA_READY:
    case FaceLoginState.DETECTING_FACE:
    default:
      return 'Opening camera...';
  }
}

/**
 * Maps face-registration UI state to a single user-facing status line.
 */
export function getFaceRegisterSimpleStatus({
  cameraReady,
  isVerifying,
  isRegistering,
  hasError,
}) {
  if (hasError) {
    return null;
  }

  if (!cameraReady) {
    return 'Opening camera...';
  }

  if (isRegistering) {
    return 'Registering...';
  }

  if (isVerifying) {
    return 'Verifying...';
  }

  return 'Opening camera...';
}

export function isFaceLoginProcessing(state) {
  return state !== FaceLoginState.FAILED && state !== FaceLoginState.IDLE;
}
