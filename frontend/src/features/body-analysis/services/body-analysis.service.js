import { API_ENDPOINTS, FACE_AI_TIMEOUT_MS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

const BODY_IMAGE_FIELD = 'image';
const BODY_VIDEO_FIELD = 'video';

function buildBodyFormData({ imageFile, videoFile, height }) {
  const formData = new FormData();

  if (imageFile) {
    formData.append(BODY_IMAGE_FIELD, imageFile, imageFile.name || 'body.jpg');
  }

  if (videoFile) {
    formData.append(BODY_VIDEO_FIELD, videoFile, videoFile.name || 'walkaround.mp4');
  }

  if (height) {
    formData.append('height', String(height));
  }

  return formData;
}

export function fetchBodyAnalysis(token) {
  return apiClient(API_ENDPOINTS.BODY_ANALYSIS.ME, { token });
}

export function analyzeBodyImage(token, { imageFile, videoFile, height } = {}) {
  if (!imageFile && !videoFile) {
    throw new Error('Provide an image and/or a walkaround video.');
  }

  return apiClient(API_ENDPOINTS.BODY_ANALYSIS.ANALYZE, {
    method: 'POST',
    body: buildBodyFormData({ imageFile, videoFile, height }),
    token,
    timeoutMs: FACE_AI_TIMEOUT_MS,
  });
}

export function analyzeCurrentBody(token) {
  return apiClient(API_ENDPOINTS.BODY_ANALYSIS.ANALYZE_CURRENT, {
    method: 'POST',
    token,
    timeoutMs: FACE_AI_TIMEOUT_MS,
  });
}

export function updateBodyAnalysis(payload, token) {
  return apiClient(API_ENDPOINTS.BODY_ANALYSIS.UPDATE, {
    method: 'PUT',
    body: payload,
    token,
  });
}
