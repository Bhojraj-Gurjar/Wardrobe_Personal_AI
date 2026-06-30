import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';
import { buildProductQueryString } from '@/features/products/schemas/product.schema';

export function fetchProducts(params = {}) {
  const query = buildProductQueryString(params);
  return apiClient(`${API_ENDPOINTS.PRODUCTS.BASE}${query}`);
}

export function fetchProductById(id) {
  return apiClient(API_ENDPOINTS.PRODUCTS.BY_ID(id));
}

export function searchProducts(params = {}) {
  const query = buildProductQueryString(params);
  return apiClient(`${API_ENDPOINTS.PRODUCTS.SEARCH}${query}`);
}

export function fetchProductsByCategory(category, params = {}) {
  const query = buildProductQueryString(params);
  return apiClient(`${API_ENDPOINTS.PRODUCTS.BY_CATEGORY(category)}${query}`);
}
