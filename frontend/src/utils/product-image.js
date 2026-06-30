import { API_BASE_URL, resolveStorageOrigin } from '@/constants/api';

const PRODUCT_PLACEHOLDER = '/avatar/shoes/placeholder.svg';

function normalizeUrl(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

/**
 * Convert relative storage paths into absolute URLs using the API storage origin.
 */
export function resolveProductImageUrl(url) {
  const trimmed = normalizeUrl(url);

  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    const localUploadMatch = trimmed.match(
      /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/uploads\/.*)$/i,
    );

    if (localUploadMatch) {
      return `${resolveStorageOrigin()}${localUploadMatch[1]}`;
    }

    return trimmed;
  }

  const origin = resolveStorageOrigin();

  if (trimmed.startsWith('/')) {
    return `${origin}${trimmed}`;
  }

  return `${origin}/${trimmed}`;
}

function readGalleryImages(product) {
  const gallery = product?.images
    || product?.productImages
    || product?.product_images
    || [];

  return Array.isArray(gallery) ? gallery : [];
}

function readPrimaryGalleryUrl(product) {
  const gallery = readGalleryImages(product);
  const primary = gallery.find((image) => image.is_primary || image.isPrimary) || gallery[0];

  return normalizeUrl(primary?.url || primary?.imageUrl || primary?.image_url);
}

function readVariantImageUrl(product) {
  const variants = product?.variants || [];

  if (!Array.isArray(variants) || !variants.length) {
    return null;
  }

  const variant = variants.find((item) => item?.image_url || item?.imageUrl);

  return normalizeUrl(variant?.image_url || variant?.imageUrl);
}

function readMediaUrl(product) {
  const media = product?.media;

  if (!Array.isArray(media) || !media.length) {
    return null;
  }

  const first = media[0];

  return normalizeUrl(typeof first === 'string' ? first : first?.url || first?.imageUrl);
}

function isUploadedProductImageUrl(url) {
  const normalized = normalizeUrl(url);

  if (!normalized) {
    return false;
  }

  return normalized.toLowerCase().includes('/uploads/products');
}

function collectRawCandidates(product) {
  const galleryUrls = readGalleryImages(product)
    .map((image) => normalizeUrl(image?.url || image?.imageUrl || image?.image_url))
    .filter(Boolean);

  return {
    tryOnImage: normalizeUrl(product.tryOnImage ?? product.try_on_image),
    thumbnail: normalizeUrl(product.thumbnail ?? product.thumbnailUrl ?? product.thumbnail_url),
    catalogImage: normalizeUrl(product.imageUrl ?? product.image_url ?? product.image),
    galleryPrimary: readPrimaryGalleryUrl(product),
    variantImage: readVariantImageUrl(product),
    mediaImage: readMediaUrl(product),
    galleryUrls,
  };
}

/**
 * Resolve the best display image for a product across API response shapes.
 */
export function getProductImage(product, options = {}) {
  const { placeholder = PRODUCT_PLACEHOLDER, debug = false } = options;

  if (!product) {
    return placeholder;
  }

  const {
    tryOnImage,
    thumbnail,
    catalogImage,
    galleryPrimary,
    variantImage,
    mediaImage,
    galleryUrls,
  } = collectRawCandidates(product);

  const uploadedCandidates = [
    tryOnImage,
    galleryPrimary,
    catalogImage,
    ...galleryUrls,
    variantImage,
  ].filter(isUploadedProductImageUrl);

  const resolvedRaw = (
    uploadedCandidates[0]
    || tryOnImage
    || galleryPrimary
    || catalogImage
    || galleryUrls[0]
    || thumbnail
    || variantImage
    || mediaImage
    || null
  );

  const resolved = resolveProductImageUrl(resolvedRaw);

  if (debug && process.env.NODE_ENV === 'development') {
    console.debug('[product-image]', {
      productId: product.id,
      name: product.name,
      tryOnImage,
      galleryPrimary,
      catalogImage,
      thumbnail,
      resolvedRaw,
      resolved,
    });
  }

  if (!resolved) {
    return placeholder ?? PRODUCT_PLACEHOLDER;
  }

  return resolved;
}

export function getProductThumbnail(product, options = {}) {
  const thumbnail = normalizeUrl(
    product?.thumbnailUrl
    ?? product?.thumbnail_url
    ?? product?.thumbnail,
  );

  if (thumbnail) {
    return resolveProductImageUrl(thumbnail) || getProductImage(product, options);
  }

  return getProductImage(product, options);
}

export function getProductInitials(product) {
  const name = String(product?.name || product?.brand || '?').trim();

  if (!name) {
    return '?';
  }

  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

export { PRODUCT_PLACEHOLDER as PRODUCT_IMAGE_PLACEHOLDER };

/**
 * All gallery images for a product (primary + ProductImage records).
 */
export function getProductGalleryImages(product) {
  if (!product) {
    return [];
  }

  const seen = new Set();
  const images = [];

  const pushImage = (url, meta = {}) => {
    const resolved = resolveProductImageUrl(url);

    if (!resolved || seen.has(resolved)) {
      return;
    }

    seen.add(resolved);
    images.push({
      id: meta.id ?? `image-${images.length}`,
      url: resolved,
      isPrimary: Boolean(meta.isPrimary),
    });
  };

  const gallery = readGalleryImages(product);

  for (const image of gallery) {
    pushImage(image?.url || image?.imageUrl || image?.image_url, {
      id: image?.id,
      isPrimary: image?.is_primary || image?.isPrimary,
    });
  }

  const primaryCandidates = [
    product.tryOnImage,
    product.try_on_image,
    product.imageUrl,
    product.image_url,
    product.image,
    product.thumbnailUrl,
    product.thumbnail,
  ];

  for (const candidate of primaryCandidates) {
    pushImage(candidate, { isPrimary: images.length === 0 });
  }

  if (images.length && !images.some((image) => image.isPrimary)) {
    images[0].isPrimary = true;
  }

  return images;
}
