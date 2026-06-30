import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

export function fetchStylistSuggestions(token) {
  return apiClient(API_ENDPOINTS.STYLIST.SUGGESTIONS, { token });
}

export function fetchStylistSessions(token) {
  return apiClient(API_ENDPOINTS.STYLIST.SESSIONS, { token });
}

export function fetchStylistSession(id, token) {
  return apiClient(API_ENDPOINTS.STYLIST.SESSION_BY_ID(id), { token });
}

export function createStylistSession(token, title) {
  return apiClient(API_ENDPOINTS.STYLIST.SESSIONS, {
    method: 'POST',
    body: title ? { title } : {},
    token,
  });
}

export function sendStylistMessage(payload, token) {
  return apiClient(API_ENDPOINTS.STYLIST.CHAT, {
    method: 'POST',
    body: payload,
    token,
  });
}

export function deleteStylistSession(id, token) {
  return apiClient(API_ENDPOINTS.STYLIST.SESSION_BY_ID(id), {
    method: 'DELETE',
    token,
  });
}
