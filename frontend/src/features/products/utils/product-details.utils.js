import { getProductGalleryImages } from '@/utils/product-image';
import { DEFAULT_CURRENCY, formatCurrency } from '@/utils/currency';

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const RECENTLY_VIEWED_KEY = 'wardrobe-recently-viewed';
const RECENTLY_VIEWED_LIMIT = 12;

export function getGalleryImages(product) {
  return getProductGalleryImages(product);
}

export function deriveDiscountPercent(price, compareAt) {
  const current = Number(price);
  const original = Number(compareAt);

  if (!original || original <= current) {
    return null;
  }

  return Math.round(((original - current) / original) * 100);
}

export function deriveEmiLabel(price, currency = DEFAULT_CURRENCY) {
  const amount = Number(price);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const monthly = amount / 3;
  const formatted = formatCurrency(monthly, currency, { maximumFractionDigits: 0 });

  return `or 3 payments of ${formatted} with zero interest`;
}

export function getProductColors(product) {
  const variants = product?.variants || [];
  const fromVariants = [...new Set(variants.map((variant) => variant.color).filter(Boolean))];

  if (fromVariants.length) {
    return fromVariants.map((color) => ({
      id: color,
      label: color,
      imageUrl: variants.find((variant) => variant.color === color)?.imageUrl
        || variants.find((variant) => variant.color === color)?.image_url
        || null,
    }));
  }

  if (product?.color) {
    return [{ id: product.color, label: product.color, imageUrl: null }];
  }

  return [];
}

export function getProductSizes(product) {
  const variants = product?.variants || [];

  if (variants.length) {
    const sizes = [...new Set(variants.map((variant) => variant.size).filter(Boolean))];

    return sizes.map((size) => {
      const variant = variants.find((entry) => entry.size === size);
      const stock = variant?.stock ?? product?.stock_quantity ?? null;

      return {
        id: size,
        label: size,
        inStock: stock == null ? true : Number(stock) > 0,
        stock: stock == null ? null : Number(stock),
      };
    });
  }

  const sizeOptions = product?.sizeOptions || product?.size_options || DEFAULT_SIZES;

  return sizeOptions.map((size) => ({
    id: size,
    label: size,
    inStock: true,
    stock: null,
  }));
}

export function isProductInStock(product) {
  if (product?.isActive === false || product?.is_active === false) {
    return false;
  }

  const variants = product?.variants || [];

  if (variants.length) {
    return variants.some((variant) => Number(variant.stock ?? 0) > 0);
  }

  const stock = product?.stock_quantity ?? product?.stockQuantity;

  if (stock == null) {
    return true;
  }

  return Number(stock) > 0;
}

export function isTryOnCompatible(product) {
  return product?.isTryOnCompatible === true
    || product?.is_try_on_compatible === true
    || product?.integration?.tryOn?.compatible === true;
}

export function buildRatingBreakdown(rating = 4.5, reviewCount = 120) {
  const weights = [0.62, 0.22, 0.1, 0.04, 0.02];
  const total = Math.max(reviewCount, 1);

  return [5, 4, 3, 2, 1].map((stars, index) => ({
    stars,
    percent: Math.round(weights[index] * 100),
    count: Math.round(total * weights[index]),
  }));
}

export function recordRecentlyViewed(productId) {
  if (typeof window === 'undefined' || !productId) {
    return;
  }

  try {
    const existing = JSON.parse(window.localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    const next = [productId, ...existing.filter((id) => id !== productId)].slice(0, RECENTLY_VIEWED_LIMIT);
    window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors.
  }
}

export function readRecentlyViewedIds(excludeId) {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const existing = JSON.parse(window.localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    return existing.filter((id) => id && id !== excludeId);
  } catch {
    return [];
  }
}
