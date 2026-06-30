import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

export function fetchSearchSuggestions(query, { signal, limit = 8 } = {}) {
  const search = new URLSearchParams();

  if (query) {
    search.set('q', query);
  }

  if (limit) {
    search.set('limit', String(limit));
  }

  const suffix = search.toString();
  return apiClient(`${API_ENDPOINTS.PRODUCTS.SEARCH_SUGGEST}${suffix ? `?${suffix}` : ''}`, {
    signal,
  });
}

export function fetchSearchResults(params = {}, { signal } = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });

  const suffix = search.toString();
  return apiClient(`${API_ENDPOINTS.PRODUCTS.SEARCH}${suffix ? `?${suffix}` : ''}`, { signal });
}

export function fetchSearchHistory(token) {
  return apiClient(API_ENDPOINTS.USER_ACTIVITY.SEARCHES, { token });
}

export function clearSearchHistory(token) {
  return apiClient(API_ENDPOINTS.USER_ACTIVITY.SEARCHES, {
    method: 'DELETE',
    token,
  });
}
