function normalizeUrl(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

export function isUploadedProductImageUrl(url) {
  const normalized = normalizeUrl(url);

  if (!normalized) {
    return false;
  }

  return normalized.toLowerCase().includes('/uploads/products');
}

function readGalleryImages(product) {
  const gallery = product?.images || product?.productImages || product?.product_images || [];

  if (!Array.isArray(gallery)) {
    return [];
  }

  return gallery;
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

/**
 * Resolve the best raw garment/catalog image URL from a product record.
 * Prefers admin-uploaded gallery images over stale seed try_on_image URLs.
 */
export function resolveRawProductImageUrl(product) {
  if (!product) {
    return null;
  }

  const tryOnImage = normalizeUrl(product.try_on_image ?? product.tryOnImage);
  const catalogImage = normalizeUrl(product.image_url ?? product.imageUrl);
  const galleryPrimary = readPrimaryGalleryUrl(product);
  const variantImage = readVariantImageUrl(product);
  const mediaImage = readMediaUrl(product);
  const galleryUrls = readGalleryImages(product)
    .map((image) => normalizeUrl(image?.url || image?.imageUrl || image?.image_url))
    .filter(Boolean);

  const uploadedCandidates = [
    tryOnImage,
    galleryPrimary,
    catalogImage,
    variantImage,
    ...galleryUrls,
  ].filter(isUploadedProductImageUrl);

  if (uploadedCandidates.length) {
    return uploadedCandidates[0];
  }

  return (
    tryOnImage
    || galleryPrimary
    || catalogImage
    || variantImage
    || mediaImage
    || galleryUrls[0]
    || null
  );
}

export function resolvePublicProductImageUrl(product, storagePathResolver) {
  const rawUrl = resolveRawProductImageUrl(product);

  if (!rawUrl) {
    return null;
  }

  return storagePathResolver?.toPublicUrl(rawUrl) || rawUrl;
}

export function mapProductImagesForResponse(product, storagePathResolver) {
  return readGalleryImages(product).map((image, index) => {
    const rawUrl = normalizeUrl(image?.url || image?.imageUrl || image?.image_url);

    return {
      id: image?.id ?? null,
      url: rawUrl ? (storagePathResolver?.toPublicUrl(rawUrl) || rawUrl) : null,
      sortOrder: image?.sort_order ?? image?.sortOrder ?? index,
      isPrimary: Boolean(image?.is_primary ?? image?.isPrimary ?? index === 0),
    };
  }).filter((image) => image.url);
}
