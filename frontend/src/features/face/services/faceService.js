import { API_ENDPOINTS, FACE_AI_TIMEOUT_MS } from '@/constants/api';
import { apiClient } from '@/services/api-client';
import { logFaceStep, logFaceStepError, FaceFlowLog } from '@/features/face/utils/face-flow-log';

const FACE_UPLOAD_FIELD = 'frontFace';
const FACE_LIVENESS_FRAMES_FIELD = 'livenessFrames';

function buildFaceFormData(imageFile) {
  const formData = new FormData();
  formData.append(FACE_UPLOAD_FIELD, imageFile, imageFile.name || 'front-face.jpg');
  return formData;
}

function buildSecureFaceFormData(payload) {
  const {
    primaryFrame,
    frames = [],
    challengeType,
    captureSessionId,
  } = payload;

  const orderedFrames = frames.length
    ? frames
    : primaryFrame
      ? [primaryFrame]
      : [];

  if (orderedFrames.length < 2) {
    throw new Error('Missing live camera frames.');
  }

  const formData = new FormData();

  formData.append(
    FACE_UPLOAD_FIELD,
    orderedFrames[0],
    orderedFrames[0].name || 'front-face.jpg',
  );

  orderedFrames.slice(1).forEach((frame, index) => {
    formData.append(
      FACE_LIVENESS_FRAMES_FIELD,
      frame,
      frame.name || `liveness-${index + 1}.jpg`,
    );
  });

  if (challengeType) {
    formData.append('challengeType', challengeType);
  }

  if (captureSessionId) {
    formData.append('captureSessionId', captureSessionId);
  }

  return formData;
}

export function registerFaceImage(imageFile, token, securePayload = null) {
  logFaceStep(4, `request sent → ${API_ENDPOINTS.FACE.REGISTER}`);
  const body = securePayload
    ? buildSecureFaceFormData(securePayload)
    : buildFaceFormData(imageFile);

  return apiClient(API_ENDPOINTS.FACE.REGISTER, {
    method: 'POST',
    body,
    token,
    timeoutMs: FACE_AI_TIMEOUT_MS,
  }).then((result) => {
    logFaceStep(5, 'NestJS response received');
    FaceFlowLog.embeddingGenerated();
    FaceFlowLog.embeddingSaved();
    FaceFlowLog.registrationSuccess();
    return result;
  }).catch((err) => {
    logFaceStepError(5, err);
    throw err;
  });
}

export function loginWithFaceImage(imageFile, options = {}) {
  logFaceStep(4, `request sent → ${API_ENDPOINTS.FACE.LOGIN}`);

  const body = options.securePayload
    ? buildSecureFaceFormData(options.securePayload)
    : buildFaceFormData(imageFile);

  return apiClient(API_ENDPOINTS.FACE.LOGIN, {
    method: 'POST',
    body,
    timeoutMs: FACE_AI_TIMEOUT_MS,
    signal: options.signal,
  }).then((result) => {
    logFaceStep(5, 'NestJS response received');
    if (result?.similarityScore != null) {
      FaceFlowLog.matchingScore(result.similarityScore);
    }
    return result;
  }).catch((err) => {
    logFaceStepError(5, err);
    throw err;
  });
}

export function verifyFaceImage(imageFile, token) {
  return apiClient(API_ENDPOINTS.FACE.VERIFY, {
    method: 'POST',
    body: buildFaceFormData(imageFile),
    token,
    timeoutMs: FACE_AI_TIMEOUT_MS,
  }).then((result) => {
    if (result?.verified !== true) {
      throw new Error('Face not recognized.');
    }

    return result;
  });
}

export function verifyFaceForLogout(imageFile, token) {
  return apiClient(API_ENDPOINTS.FACE.LOGOUT, {
    method: 'POST',
    body: buildFaceFormData(imageFile),
    token,
    timeoutMs: FACE_AI_TIMEOUT_MS,
  }).then((result) => {
    if (result?.verified !== true || !result?.logoutNonce) {
      throw new Error('Face not recognized.');
    }

    return result;
  });
}

export function updateFacePhoto(imageFile, token, securePayload = null) {
  const body = securePayload
    ? buildSecureFaceFormData(securePayload)
    : buildFaceFormData(imageFile);

  return apiClient(API_ENDPOINTS.FACE.PHOTO, {
    method: 'PUT',
    body,
    token,
    timeoutMs: FACE_AI_TIMEOUT_MS,
  });
}
