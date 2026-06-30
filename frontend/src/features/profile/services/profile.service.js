import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

export function fetchProfile(token, options = {}) {
  return apiClient(API_ENDPOINTS.USERS.PROFILE, { token, ...options });
}

export function updateProfile(payload, token) {
  return apiClient(API_ENDPOINTS.USERS.PROFILE, {
    method: 'PUT',
    body: payload,
    token,
  });
}

export function ensureUserArtifacts(token) {
  return apiClient(API_ENDPOINTS.USERS.ENSURE_ARTIFACTS, {
    method: 'POST',
    token,
  });
}

export function changePassword(payload, token) {
  return apiClient(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
    method: 'POST',
    body: payload,
    token,
  });
}
