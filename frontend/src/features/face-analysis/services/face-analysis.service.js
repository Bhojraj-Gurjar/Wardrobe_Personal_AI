import { API_ENDPOINTS, FACE_AI_TIMEOUT_MS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

const FACE_UPLOAD_FIELD = 'frontFace';

function buildFaceFormData(imageFile, captureSource = 'upload') {
  const formData = new FormData();
  formData.append(FACE_UPLOAD_FIELD, imageFile, imageFile.name || 'front-face.jpg');
  if (captureSource) {
    formData.append('captureSource', captureSource);
  }
  return formData;
}

export function fetchFaceAnalysis(token) {
  return apiClient(API_ENDPOINTS.FACE_ANALYSIS.ME, { token });
}

export function analyzeFaceImage(imageFile, token, options = {}) {
  return apiClient(API_ENDPOINTS.FACE_ANALYSIS.ANALYZE, {
    method: 'POST',
    body: buildFaceFormData(imageFile, options.captureSource || 'upload'),
    token,
    timeoutMs: FACE_AI_TIMEOUT_MS,
  });
}

export function analyzeCurrentFace(token) {
  return apiClient(API_ENDPOINTS.FACE_ANALYSIS.ANALYZE_CURRENT, {
    method: 'POST',
    token,
    timeoutMs: FACE_AI_TIMEOUT_MS,
  });
}

export function updateFaceAnalysis(payload, token) {
  return apiClient(API_ENDPOINTS.FACE_ANALYSIS.UPDATE, {
    method: 'PUT',
    body: payload,
    token,
  });
}
