import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/services/api-client';

export function fetchClosetOverview(token) {
  return apiClient(API_ENDPOINTS.PERSONAL_CLOSET.OVERVIEW, { token });
}

export function fetchPurchasedItems(token, params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  const path = query
    ? `${API_ENDPOINTS.PERSONAL_CLOSET.PURCHASED_ITEMS}?${query}`
    : API_ENDPOINTS.PERSONAL_CLOSET.PURCHASED_ITEMS;

  return apiClient(path, { token });
}

export function removePurchasedItem(orderId, productId, token) {
  return apiClient(
    API_ENDPOINTS.PERSONAL_CLOSET.PURCHASED_ITEM(orderId, productId),
    { method: 'DELETE', token },
  );
}

export function fetchSavedOutfits(token) {
  return apiClient(API_ENDPOINTS.PERSONAL_CLOSET.OUTFITS, { token });
}

export function updateSavedOutfit(id, body, token) {
  return apiClient(API_ENDPOINTS.PERSONAL_CLOSET.OUTFIT_BY_ID(id), {
    method: 'PATCH',
    body,
    token,
  });
}

export function deleteSavedOutfit(id, token) {
  return apiClient(API_ENDPOINTS.PERSONAL_CLOSET.OUTFIT_BY_ID(id), {
    method: 'DELETE',
    token,
  });
}

export function addOutfitToCart(id, token) {
  return apiClient(API_ENDPOINTS.PERSONAL_CLOSET.OUTFIT_ADD_TO_CART(id), {
    method: 'POST',
    token,
  });
}

export function fetchFavoriteBrands(token) {
  return apiClient(API_ENDPOINTS.PERSONAL_CLOSET.FAVORITE_BRANDS, { token });
}

export function removeFavoriteBrand(brandName, token) {
  return apiClient(
    API_ENDPOINTS.PERSONAL_CLOSET.FAVORITE_BRAND(encodeURIComponent(brandName)),
    { method: 'DELETE', token },
  );
}

export function fetchFavoriteColors(token) {
  return apiClient(API_ENDPOINTS.PERSONAL_CLOSET.FAVORITE_COLORS, { token });
}

export function removeFavoriteColor(colorName, token) {
  return apiClient(
    API_ENDPOINTS.PERSONAL_CLOSET.FAVORITE_COLOR(encodeURIComponent(colorName)),
    { method: 'DELETE', token },
  );
}

export function searchCloset(token, params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  const path = query
    ? `${API_ENDPOINTS.PERSONAL_CLOSET.SEARCH}?${query}`
    : API_ENDPOINTS.PERSONAL_CLOSET.SEARCH;

  return apiClient(path, { token });
}
