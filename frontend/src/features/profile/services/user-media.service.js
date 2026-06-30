import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

export function fetchUserMedia(token, options = {}) {
  return apiClient(API_ENDPOINTS.USERS.MEDIA, { token, ...options });
}

export function fetchLatestUserMedia(module, token, options = {}) {
  return apiClient(API_ENDPOINTS.USERS.MEDIA_LATEST(module), { token, ...options });
}

export function fetchUserMediaHistory(module, token, options = {}) {
  return apiClient(API_ENDPOINTS.USERS.MEDIA_HISTORY(module), { token, ...options });
}
