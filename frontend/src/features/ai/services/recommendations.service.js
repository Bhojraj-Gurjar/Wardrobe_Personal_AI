import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.type) {
    searchParams.set('type', String(params.type));
  }

  if (params.event) {
    searchParams.set('event', String(params.event));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function fetchRecommendations(params, token) {
  return apiClient(
    `${API_ENDPOINTS.RECOMMENDATIONS}${buildQuery(params)}`,
    { token },
  );
}

export function fetchDailyRecommendations(params, token) {
  return apiClient(
    `${API_ENDPOINTS.RECOMMENDATIONS_DAILY}${buildQuery(params)}`,
    { token },
  );
}

export function fetchSeasonalRecommendations(params, token) {
  return apiClient(
    `${API_ENDPOINTS.RECOMMENDATIONS_SEASONAL}${buildQuery(params)}`,
    { token },
  );
}

export function fetchEventRecommendations(params, token) {
  return apiClient(
    `${API_ENDPOINTS.RECOMMENDATIONS_EVENT}${buildQuery(params)}`,
    { token },
  );
}

export function fetchTrendingRecommendations(params, token) {
  return apiClient(
    `${API_ENDPOINTS.RECOMMENDATIONS_TRENDING}${buildQuery(params)}`,
    { token },
  );
}
