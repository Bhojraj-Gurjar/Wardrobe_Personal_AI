/**
 * Face-login-only capture tuning — registration keeps FACE_AUTH_CAPTURE_SETTINGS unchanged.
 * Values align with ai-service FACE_MIN_CAPTURE_FRAMES (3) to minimize upload + inference time.
 */
export const FACE_LOGIN_CAPTURE_SETTINGS = {
  captureMaxWidth: 640,
  captureQuality: 0.82,
  minFrames: 3,
  maxFrames: 3,
  captureIntervalMs: 100,
  detectionIntervalMs: 80,
  positionStableMs: 400,
  stableFrameCount: 2,
  captureWarmupMs: 0,
};
