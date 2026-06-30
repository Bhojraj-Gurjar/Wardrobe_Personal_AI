import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

export function fetchAddresses(token) {
  return apiClient(API_ENDPOINTS.ADDRESSES.BASE, { token });
}

export function createAddress(token, payload) {
  return apiClient(API_ENDPOINTS.ADDRESSES.BASE, {
    method: 'POST',
    body: payload,
    token,
  });
}

export function updateAddress(token, id, payload) {
  return apiClient(API_ENDPOINTS.ADDRESSES.BY_ID(id), {
    method: 'PATCH',
    body: payload,
    token,
  });
}

export function deleteAddress(token, id) {
  return apiClient(API_ENDPOINTS.ADDRESSES.BY_ID(id), {
    method: 'DELETE',
    token,
  });
}

export function checkoutCart(token, payload) {
  return apiClient(API_ENDPOINTS.CART.CHECKOUT, {
    method: 'POST',
    body: payload,
    token,
  });
}
