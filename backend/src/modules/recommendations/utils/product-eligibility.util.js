import { resolveProductAvatarOverlayUrl } from '../../products/utils/product-avatar-overlay.util';

export function productHasCatalogImage(product = {}) {
  if (product.image_url || product.imageUrl) {
    return true;
  }

  return Array.isArray(product.images)
    && product.images.some((image) => Boolean(image?.url));
}

export function isRecommendableProduct(product = {}) {
  if (!product?.is_active && product?.is_active !== undefined) {
    return false;
  }

  if (!productHasCatalogImage(product)) {
    return false;
  }

  return Boolean(resolveProductAvatarOverlayUrl(product));
}

export function filterRecommendableProducts(products = []) {
  return products.filter((product) => isRecommendableProduct(product));
}
