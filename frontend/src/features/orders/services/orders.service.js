import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

export function fetchOrders(token, params = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.status) searchParams.set('status', params.status);

  const query = searchParams.toString();
  return apiClient(`${API_ENDPOINTS.ORDERS.BASE}${query ? `?${query}` : ''}`, { token });
}

export function fetchOrderById(id, token) {
  return apiClient(API_ENDPOINTS.ORDERS.BY_ID(id), { token });
}

export function cancelOrder(id, token) {
  return apiClient(API_ENDPOINTS.ORDERS.CANCEL(id), {
    method: 'POST',
    token,
  });
}
