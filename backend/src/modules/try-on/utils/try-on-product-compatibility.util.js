const CLOTHING_KEYWORDS = [
  'shirt',
  'shirts',
  't-shirt',
  'tshirt',
  'tee',
  'top',
  'blouse',
  'pants',
  'trouser',
  'chino',
  'jean',
  'jacket',
  'coat',
  'hoodie',
  'sweater',
  'dress',
  'skirt',
  'kurta',
  'suit',
];

const INCOMPATIBLE_KEYWORDS = [
  'shoe',
  'sneaker',
  'footwear',
  'boot',
  'sandal',
  'watch',
  'bag',
  'belt',
  'hat',
  'cap',
  'sock',
  'jewelry',
  'accessory',
];

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

function matchesClothingCategory(product) {
  const haystack = [
    product.category,
    product.subcategory,
    product.name,
    product.sku,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (INCOMPATIBLE_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return false;
  }

  return CLOTHING_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

export function assessTryOnCompatibility(product) {
  const tryOnImage = resolvePrimaryImageUrl(product);

  if (product.is_try_on_compatible === true && tryOnImage) {
    return {
      isTryOnCompatible: true,
      tryOnImage: product.try_on_image || tryOnImage,
      compatibilityLabel: 'Try-On Available',
    };
  }

  if (product.is_try_on_compatible === false) {
    return {
      isTryOnCompatible: false,
      tryOnImage: product.try_on_image || tryOnImage,
      compatibilityLabel: 'Not Compatible',
    };
  }

  if (!tryOnImage || !hasCatalogStyleImage(tryOnImage)) {
    return {
      isTryOnCompatible: false,
      tryOnImage,
      compatibilityLabel: 'Not Compatible',
    };
  }

  const clothingMatch = matchesClothingCategory(product);
  const compatible = clothingMatch && hasCatalogStyleImage(tryOnImage);

  return {
    isTryOnCompatible: compatible,
    tryOnImage: product.try_on_image || tryOnImage,
    compatibilityLabel: compatible ? 'Try-On Available' : 'Not Compatible',
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
    price: product.price,
    currency: product.currency || 'USD',
    imageUrl: garmentUrl,
    tryOnImage: garmentUrl,
    isTryOnCompatible: compatibility.isTryOnCompatible,
    compatibilityLabel: compatibility.compatibilityLabel,
  };
}
