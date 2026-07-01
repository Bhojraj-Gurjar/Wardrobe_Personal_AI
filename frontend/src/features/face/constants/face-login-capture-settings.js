/**
 * Fast face-auth capture tuning (login + registration).
 * Values align with ai-service face_min_capture_frames to minimize upload + inference time.
 */
export const FACE_LOGIN_CAPTURE_SETTINGS = {
  captureMaxWidth: 640,
  captureQuality: 0.82,
  minFrames: 2,
  maxFrames: 2,
  captureIntervalMs: 0,
  detectionIntervalMs: 50,
  positionStableMs: 150,
  stableFrameCount: 1,
  captureWarmupMs: 0,
};
