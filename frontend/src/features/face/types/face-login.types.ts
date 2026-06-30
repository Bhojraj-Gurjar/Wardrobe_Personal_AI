/** High-level steps in the face login authentication flow. */
export enum FaceLoginState {
  IDLE = 'idle',
  INITIALIZING_CAMERA = 'initializing_camera',
  CAMERA_READY = 'camera_ready',
  DETECTING_FACE = 'detecting_face',
  CAPTURING_FACE = 'capturing_face',
  SENDING_REQUEST = 'sending_request',
  VERIFYING_IDENTITY = 'verifying_identity',
  SUCCESS = 'success',
  FAILED = 'failed',
}

/** Typed failure reasons surfaced to the user. */
export enum FaceLoginError {
  CAMERA_PERMISSION_DENIED = 'camera_permission_denied',
  CAMERA_NOT_FOUND = 'camera_not_found',
  CAMERA_UNAVAILABLE = 'camera_unavailable',
  FACE_NOT_DETECTED = 'face_not_detected',
  MULTIPLE_FACES = 'multiple_faces',
  FACE_TOO_FAR = 'face_too_far',
  FACE_TOO_CLOSE = 'face_too_close',
  POOR_LIGHTING = 'poor_lighting',
  NETWORK_ERROR = 'network_error',
  BACKEND_ERROR = 'backend_error',
  TIMEOUT = 'timeout',
  FACE_NOT_RECOGNIZED = 'face_not_recognized',
  CAPTURE_FAILED = 'capture_failed',
  LIVENESS_FAILED = 'liveness_failed',
  RATE_LIMITED = 'rate_limited',
  UNKNOWN = 'unknown',
}

export type FaceLoginStatusStep = {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
};

export type FaceAnalysisIssue = FaceLoginError | null;

export type FaceAnalysisResult = {
  issue: FaceAnalysisIssue;
  ready: boolean;
  faceCount: number;
};
