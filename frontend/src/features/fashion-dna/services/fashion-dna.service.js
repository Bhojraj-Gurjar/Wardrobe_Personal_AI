import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

export function fetchFashionDna(token) {
  return apiClient(API_ENDPOINTS.FASHION_DNA.ME, { token });
}

export function generateFashionDna(token) {
  return apiClient(API_ENDPOINTS.FASHION_DNA.GENERATE, {
    method: 'POST',
    token,
  });
}

export function updateFashionDna(payload, token) {
  return apiClient(API_ENDPOINTS.FASHION_DNA.UPDATE, {
    method: 'PUT',
    body: payload,
    token,
  });
}

export function fetchFashionDnaHistory(token, params = {}) {
  const search = new URLSearchParams();

  if (params.limit) {
    search.set('limit', String(params.limit));
  }

  const query = search.toString();
  const path = query
    ? `${API_ENDPOINTS.FASHION_DNA.HISTORY}?${query}`
    : API_ENDPOINTS.FASHION_DNA.HISTORY;

  return apiClient(path, { token });
}
