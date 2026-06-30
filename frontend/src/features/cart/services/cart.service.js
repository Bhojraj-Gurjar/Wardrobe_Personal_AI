import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

export function addCartItem(productId, token, quantity = 1) {
  return apiClient(API_ENDPOINTS.CART.ITEMS, {
    method: 'POST',
    body: { product_id: productId, quantity },
    token,
  });
}

export function fetchCart(token, coupon) {
  const query = coupon ? `?coupon=${encodeURIComponent(coupon)}` : '';
  return apiClient(`${API_ENDPOINTS.CART.BASE}${query}`, { token });
}

export function updateCartItem(id, quantity, token) {
  return apiClient(API_ENDPOINTS.CART.ITEM_BY_ID(id), {
    method: 'PATCH',
    body: { quantity },
    token,
  });
}

export function removeCartItem(id, token) {
  return apiClient(API_ENDPOINTS.CART.ITEM_BY_ID(id), { method: 'DELETE', token });
}

export function checkoutCart(token, payload = {}) {
  const body = typeof payload === 'string'
    ? { coupon_code: payload }
    : payload;

  return apiClient(API_ENDPOINTS.CART.CHECKOUT, {
    method: 'POST',
    body,
    token,
  });
}
