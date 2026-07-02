/**
 * Fast live-camera capture tuned for ~2s face login.
 * Registration uses FACE_REGISTRATION_CAPTURE_SETTINGS (unchanged pacing).
 */
export const FACE_LOGIN_CAPTURE_SETTINGS = {
  captureMaxWidth: 400,
  captureQuality: 0.72,
  minFrames: 3,
  maxFrames: 3,
  captureIntervalMs: 0,
  detectionIntervalMs: 33,
  positionStableMs: 80,
  stableFrameCount: 1,
  captureWarmupMs: 0,
};

export const FACE_REGISTRATION_CAPTURE_SETTINGS = {
  captureMaxWidth: 640,
  captureQuality: 0.82,
  minFrames: 5,
  maxFrames: 5,
  captureIntervalMs: 250,
  detectionIntervalMs: 66,
  positionStableMs: 400,
  stableFrameCount: 2,
  captureWarmupMs: 300,
};
