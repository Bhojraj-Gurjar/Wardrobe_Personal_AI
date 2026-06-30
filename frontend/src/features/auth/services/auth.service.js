import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

export function loginRequest(credentials) {
  return apiClient(API_ENDPOINTS.AUTH.LOGIN, {
    method: 'POST',
    body: credentials,
  });
}

export function registerRequest(payload) {
  return apiClient(API_ENDPOINTS.AUTH.REGISTER, {
    method: 'POST',
    body: payload,
  });
}

export function logoutRequest(refreshToken, token, logoutNonce) {
  return apiClient(API_ENDPOINTS.AUTH.LOGOUT, {
    method: 'POST',
    body: {
      refreshToken,
      ...(logoutNonce ? { logoutNonce } : {}),
    },
    token,
  });
}

export function refreshRequest(refreshToken) {
  return apiClient(API_ENDPOINTS.AUTH.REFRESH, {
    method: 'POST',
    body: { refreshToken },
    skipSessionInvalidation: true,
  });
}

export function fetchMe(token, options = {}) {
  return apiClient(API_ENDPOINTS.AUTH.ME, { token, ...options });
}
