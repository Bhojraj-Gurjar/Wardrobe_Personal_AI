import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

export function fetchWishlist(token) {
  return apiClient(API_ENDPOINTS.WISHLIST.BASE, { token });
}

export function addToWishlist(productId, token) {
  return apiClient(API_ENDPOINTS.WISHLIST.BASE, {
    method: 'POST',
    body: { product_id: productId },
    token,
  });
}

export function removeFromWishlist(id, token) {
  return apiClient(API_ENDPOINTS.WISHLIST.BY_ID(id), { method: 'DELETE', token });
}
