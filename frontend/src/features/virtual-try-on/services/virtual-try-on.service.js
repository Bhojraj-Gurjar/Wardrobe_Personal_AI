import { API_ENDPOINTS, FACE_AI_TIMEOUT_MS } from '@/constants/api';
import { apiClient } from '@/services/api-client';
import { getProductImage, resolveProductImageUrl } from '@/utils/product-image';
import { resolveTryOnResultImageUrl } from '../utils/try-on-image.util';

function normalizeVirtualTryOnProduct(product) {
  if (!product) {
    return product;
  }

  const imageUrl = getProductImage(product, { debug: process.env.NODE_ENV === 'development' });
  const tryOnImage = resolveProductImageUrl(product.tryOnImage ?? product.try_on_image) || imageUrl;
  const thumbnailUrl = resolveProductImageUrl(
    product.thumbnailUrl ?? product.thumbnail ?? product.thumbnail_url,
  ) || imageUrl;
  const images = (product.images || product.productImages || []).map((image) => ({
    ...image,
    url: resolveProductImageUrl(image?.url || image?.imageUrl || image?.image_url),
  }));

  return {
    ...product,
    imageUrl,
    image: imageUrl,
    tryOnImage,
    thumbnailUrl,
    thumbnail: thumbnailUrl,
    images,
    productImages: images,
    tryOnSlot: product.tryOnSlot || product.try_on_slot || null,
    tryOnRegion: product.tryOnRegion || product.try_on_region || null,
  };
}

export function fetchVirtualTryOnSetup(token) {
  return apiClient(API_ENDPOINTS.VIRTUAL_TRY_ON.SETUP, { token });
}

export function fetchVirtualTryOnProducts(params = {}, token) {
  const search = new URLSearchParams();

  if (params.page) {
    search.set('page', String(params.page));
  }
  if (params.limit) {
    search.set('limit', String(params.limit));
  }
  if (params.category) {
    search.set('category', params.category);
  }
  if (params.search) {
    search.set('search', params.search);
  }
  if (params.compatibleOnly) {
    search.set('compatibleOnly', 'true');
  }

  const query = search.toString();
  const path = query
    ? `${API_ENDPOINTS.VIRTUAL_TRY_ON.PRODUCTS}?${query}`
    : API_ENDPOINTS.VIRTUAL_TRY_ON.PRODUCTS;

  return apiClient(path, { token }).then((response) => ({
    ...response,
    products: (response?.products || []).map(normalizeVirtualTryOnProduct),
  }));
}

export function generateVirtualTryOn(productId, token, options = {}) {
  const body = options.temporaryBodyImageUrl
    ? { temporaryBodyImageUrl: options.temporaryBodyImageUrl }
    : undefined;

  const path = API_ENDPOINTS.VIRTUAL_TRY_ON.GENERATE(productId);

  if (process.env.NODE_ENV === 'development') {
    console.info('[virtual-try-on] generate request', {
      productId,
      hasTemporaryBodyImageUrl: Boolean(options.temporaryBodyImageUrl),
      path,
    });
  }

  return apiClient(path, {
    method: 'POST',
    body,
    token,
    timeoutMs: FACE_AI_TIMEOUT_MS,
    signal: options.signal,
  }).then((response) => {
    if (process.env.NODE_ENV === 'development') {
      console.info('[virtual-try-on] generate response', {
        productId,
        generatedImageUrl: response?.generatedImageUrl || response?.result?.generatedImageUrl,
        resultId: response?.result?.id,
      });
    }

    return {
      ...response,
      generatedImageUrl: resolveTryOnResultImageUrl(
        response?.generatedImageUrl || response?.result?.generatedImageUrl,
      ),
      result: response?.result
        ? {
            ...response.result,
            generatedImageUrl: resolveTryOnResultImageUrl(
              response.result.generatedImageUrl || response.generatedImageUrl,
            ),
          }
        : response?.result,
    };
  }).catch((error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[virtual-try-on] generate failed', {
        productId,
        status: error?.status,
        message: error?.message,
        payload: error?.payload,
      });
    }

    throw error;
  });
}

function normalizeTryOnGenerateResponse(response) {
  return {
    ...response,
    generatedImageUrl: resolveTryOnResultImageUrl(
      response?.generatedImageUrl || response?.result?.generatedImageUrl,
    ),
    result: response?.result
      ? {
          ...response.result,
          generatedImageUrl: resolveTryOnResultImageUrl(
            response.result.generatedImageUrl || response.generatedImageUrl,
          ),
        }
      : response?.result,
  };
}

export function generateVirtualTryOnOutfit(productIds, token, options = {}) {
  const body = {
    productIds,
    ...(options.temporaryBodyImageUrl
      ? { temporaryBodyImageUrl: options.temporaryBodyImageUrl }
      : {}),
  };

  return apiClient(API_ENDPOINTS.VIRTUAL_TRY_ON.GENERATE_OUTFIT, {
    method: 'POST',
    body,
    token,
    timeoutMs: FACE_AI_TIMEOUT_MS,
    signal: options.signal,
  }).then(normalizeTryOnGenerateResponse);
}

export function uploadTemporaryBodyPhoto(file, token) {
  const formData = new FormData();
  formData.append('image', file, file.name || 'temporary-body.jpg');

  return apiClient(API_ENDPOINTS.VIRTUAL_TRY_ON.UPLOAD_PERSON, {
    method: 'POST',
    body: formData,
    token,
    timeoutMs: FACE_AI_TIMEOUT_MS,
  }).then((response) => resolveProductImageUrl(
    response?.publicUrl
    || response?.imageUrl
    || response?.originalStoragePath
    || response?.storagePath,
  ));
}

export function clearVirtualTryOnSessionPhoto(token) {
  return apiClient(API_ENDPOINTS.VIRTUAL_TRY_ON.CLEAR_SESSION_PHOTO, {
    method: 'POST',
    token,
  });
}

export function fetchVirtualTryOnResults(token) {
  return apiClient(API_ENDPOINTS.VIRTUAL_TRY_ON.RESULTS, { token });
}

export function deleteVirtualTryOnResult(resultId, token) {
  return apiClient(API_ENDPOINTS.VIRTUAL_TRY_ON.RESULT_BY_ID(resultId), {
    method: 'DELETE',
    token,
  });
}

export function saveVirtualTryOnResultOutfit(resultId, payload, token) {
  return apiClient(API_ENDPOINTS.VIRTUAL_TRY_ON.RESULT_SAVE_OUTFIT(resultId), {
    method: 'POST',
    body: payload,
    token,
  });
}

export function addVirtualTryOnResultToCloset(resultId, token) {
  return apiClient(API_ENDPOINTS.VIRTUAL_TRY_ON.RESULT_ADD_TO_CLOSET(resultId), {
    method: 'POST',
    token,
  });
}

export function fetchVirtualTryOnProductsByCategory(categoryId, token) {
  return apiClient(
    API_ENDPOINTS.VIRTUAL_TRY_ON.PRODUCTS_BY_CATEGORY(categoryId),
    { token },
  );
}

export function applyVirtualTryOnProduct(payload, token) {
  return apiClient(API_ENDPOINTS.VIRTUAL_TRY_ON.APPLY, {
    method: 'POST',
    body: payload,
    token,
    timeoutMs: FACE_AI_TIMEOUT_MS,
  });
}

export function resetVirtualTryOnOutfit(token) {
  return apiClient(API_ENDPOINTS.VIRTUAL_TRY_ON.RESET, {
    method: 'POST',
    token,
  });
}

export function saveVirtualTryOnOutfit(payload, token) {
  return apiClient(API_ENDPOINTS.VIRTUAL_TRY_ON.SAVED_OUTFITS, {
    method: 'POST',
    body: payload,
    token,
  });
}

export function fetchSavedOutfits(token) {
  return apiClient(API_ENDPOINTS.VIRTUAL_TRY_ON.SAVED_OUTFITS, { token });
}

export function deleteSavedOutfit(outfitId, token) {
  return apiClient(API_ENDPOINTS.VIRTUAL_TRY_ON.SAVED_OUTFIT_BY_ID(outfitId), {
    method: 'DELETE',
    token,
  });
}
