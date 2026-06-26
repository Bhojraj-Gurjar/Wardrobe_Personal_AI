import {
  inferProductType,
  isTryOnCompatibleProductType,
  resolveTryOnSlotFromProductType,
} from '../../products/constants/product-type.constants';

function resolvePrimaryImageUrl(product) {
  if (!product) {
    return null;
  }

  if (product.try_on_image) {
    return product.try_on_image;
  }

  if (product.image_url) {
    return product.image_url;
  }

  const images = product.images || [];
  const primary = images.find((image) => image.is_primary) || images[0];

  return primary?.url || null;
}

function hasCatalogStyleImage(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return false;
  }

  const normalized = imageUrl.toLowerCase();

  if (normalized.includes('avatar') || normalized.includes('overlay')) {
    return false;
  }

  return /\.(jpg|jpeg|png|webp)(\?|$)/i.test(normalized)
    || normalized.includes('images.unsplash.com')
    || normalized.includes('images.pexels.com')
    || normalized.includes('/uploads/');
}

function resolveProductType(product) {
  return product.product_type
    ?? product.productType
    ?? inferProductType(product);
}

export function assessTryOnCompatibility(product) {
  const tryOnImage = resolvePrimaryImageUrl(product);
  const productType = resolveProductType(product);
  const hasTryOnSlot = Boolean(resolveTryOnSlotFromProductType(productType));

  if (product.is_try_on_compatible === true && tryOnImage && hasTryOnSlot) {
    return {
      isTryOnCompatible: true,
      tryOnImage: product.try_on_image || tryOnImage,
      compatibilityLabel: 'Try-On Available',
      productType,
    };
  }

  if (product.is_try_on_compatible === false) {
    return {
      isTryOnCompatible: false,
      tryOnImage: product.try_on_image || tryOnImage,
      compatibilityLabel: 'Not Compatible',
      productType,
    };
  }

  if (!tryOnImage || !hasCatalogStyleImage(tryOnImage)) {
    return {
      isTryOnCompatible: false,
      tryOnImage,
      compatibilityLabel: 'Not Compatible',
      productType,
    };
  }

  const compatible = isTryOnCompatibleProductType(productType) && hasCatalogStyleImage(tryOnImage);

  return {
    isTryOnCompatible: compatible,
    tryOnImage: product.try_on_image || tryOnImage,
    compatibilityLabel: compatible ? 'Try-On Available' : 'Not Compatible',
    productType,
  };
}

export function formatTryOnCatalogProduct(product, storagePathResolver) {
  const compatibility = assessTryOnCompatibility(product);
  const garmentUrl = compatibility.tryOnImage
    ? storagePathResolver.toPublicUrl(compatibility.tryOnImage)
      || compatibility.tryOnImage
    : null;

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    category: product.category,
    subcategory: product.subcategory,
    productType: compatibility.productType,
    price: product.price,
    currency: product.currency || 'USD',
    imageUrl: garmentUrl,
    tryOnImage: garmentUrl,
    isTryOnCompatible: compatibility.isTryOnCompatible,
    compatibilityLabel: compatibility.compatibilityLabel,
  };
}
