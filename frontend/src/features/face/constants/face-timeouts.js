export { FACE_AI_TIMEOUT_MS } from '@/constants/api';



/** Brief camera warmup before capture UI enables. */
export const FACE_CAPTURE_WARMUP_MS = 600;

/** Max wait for live camera frames before surfacing camera unavailable. */
export const FACE_LOGIN_CAMERA_READY_TIMEOUT_MS = 12_000;

/** Extended positioning grace for the first cold-start capture cycle. */
export const FACE_LOGIN_COLD_START_POSITION_TIMEOUT_MS = 10_000;

/** Longer per-frame analyze budget while the Shape Detection API cold-starts. */
export const FACE_LOGIN_COLD_START_ANALYZE_TIMEOUT_MS = 2_500;



/** Max time to wait for a stable face before guidance. */

export const FACE_LIVENESS_POSITION_TIMEOUT_MS = 30_000;



/** Positioning budget for face login. */

export const FACE_LOGIN_POSITION_TIMEOUT_MS = 30_000;



/** Per-frame analyze budget. */

export const FACE_LOGIN_ANALYZE_TIMEOUT_MS = 4_000;



/** Total face login attempt from camera ready through API verification. */

export const FACE_LOGIN_FLOW_TIMEOUT_MS = 30_000;



/** Registration liveness + API round-trip budget. */

export const FACE_REGISTRATION_FLOW_TIMEOUT_MS = 30_000;



export const FACE_VERIFY_TIMEOUT_MESSAGE =

  "We couldn't capture a clear face. Please ensure good lighting and look directly at the camera.";

