import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

export function recordProductView(productId, token) {
  return apiClient(API_ENDPOINTS.USER_ACTIVITY.PRODUCT_VIEWS, {
    method: 'POST',
    body: { product_id: productId },
    token,
  });
}

export function recordSearchQuery(query, token) {
  return apiClient(API_ENDPOINTS.USER_ACTIVITY.SEARCHES, {
    method: 'POST',
    body: { query },
    token,
  });
}
