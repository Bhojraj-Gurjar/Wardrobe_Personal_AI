import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

export function fetchDigitalAvatar(token) {
  return apiClient(API_ENDPOINTS.DIGITAL_AVATAR.ME, { token });
}

export function fetchDigitalAvatarHistory(token) {
  return apiClient(API_ENDPOINTS.DIGITAL_AVATAR.HISTORY, { token });
}

export function generateDigitalAvatar(token, payload = {}) {
  return apiClient(API_ENDPOINTS.DIGITAL_AVATAR.GENERATE, {
    method: 'POST',
    body: payload,
    token,
  });
}

export function generateBasicAvatar(token) {
  return apiClient(API_ENDPOINTS.DIGITAL_AVATAR.GENERATE_BASIC, {
    method: 'POST',
    token,
  });
}

export function generatePremiumAvatar(token) {
  return apiClient(API_ENDPOINTS.DIGITAL_AVATAR.GENERATE_PREMIUM, {
    method: 'POST',
    token,
  });
}

export function activateDigitalAvatar(avatarId, token) {
  return apiClient(API_ENDPOINTS.DIGITAL_AVATAR.ACTIVATE(avatarId), {
    method: 'PUT',
    token,
  });
}

export function updateDigitalAvatar(payload, token) {
  return apiClient(API_ENDPOINTS.DIGITAL_AVATAR.UPDATE, {
    method: 'PUT',
    body: payload,
    token,
  });
}
