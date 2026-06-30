import { DEFAULT_CURRENCY, formatCurrency } from '@/utils/currency';
import {
  getProductImage as resolveProductImage,
} from '@/utils/product-image';

export function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === 'object') {
    if (Array.isArray(value.items)) {
      return value.items;
    }

    if (Array.isArray(value.data)) {
      return value.data;
    }

    if (Array.isArray(value.products)) {
      return value.products;
    }
  }

  return [];
}

export function resolveRecommendationItems(recommendations) {
  if (Array.isArray(recommendations)) {
    return recommendations;
  }

  return asArray(
    recommendations?.items
    ?? recommendations?.data
    ?? recommendations?.products,
  );
}

export function normalizeTagList(tags) {
  if (Array.isArray(tags)) {
    return tags.filter(Boolean).map((tag) => String(tag));
  }

  if (tags && typeof tags === 'object') {
    return Object.values(tags).filter(Boolean).map((tag) => String(tag));
  }

  if (tags != null && tags !== '') {
    return [String(tags)];
  }

  return [];
}

export function getProductImageUrl(product) {
  return resolveProductImage(product, { placeholder: null });
}

export function formatProductPrice(price, currency = DEFAULT_CURRENCY) {
  return formatCurrency(price, currency);
}

export function normalizeMatchScore(score) {
  if (score == null || Number.isNaN(Number(score))) {
    return null;
  }

  const value = Number(score);
  if (value <= 1) {
    return Math.round(value * 100);
  }

  if (value <= 100) {
    return Math.round(value);
  }

  return Math.min(100, Math.round(value));
}

export function productMatchesSearch(product, searchTerm) {
  const query = searchTerm?.trim().toLowerCase();
  if (!query) {
    return true;
  }

  const haystack = [
    product?.name,
    product?.brand,
    product?.sku,
    product?.category,
    product?.subcategory,
    product?.productType,
    product?.product_type,
    ...normalizeTagList(product?.styleTags),
    ...normalizeTagList(product?.occasionTags),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

export function deriveProductBadges(product, { isBestMatch = false } = {}) {
  const badges = [];
  const tags = [
    ...normalizeTagList(product?.styleTags),
    ...normalizeTagList(product?.occasionTags),
  ].map((tag) => tag.toLowerCase());

  if (isBestMatch) {
    badges.push({ id: 'best-match', label: 'Best Match', tone: 'purple' });
  }

  if (tags.some((tag) => tag.includes('bestseller') || tag.includes('iconic'))) {
    badges.push({ id: 'bestseller', label: 'Bestseller', tone: 'teal' });
  }

  if (tags.some((tag) => tag.includes('editor') || tag.includes('heritage'))) {
    badges.push({ id: 'editors-pick', label: "Editor's Pick", tone: 'orange' });
  }

  if (product?.isOnSale || product?.compareAtPrice > product?.price) {
    badges.push({ id: 'sale', label: 'Sale', tone: 'sale' });
  }

  return badges.slice(0, 1);
}

export function isProductComingSoon(product) {
  if (!product) {
    return false;
  }

  const visibility = String(product.visibility || '').toUpperCase();
  if (visibility === 'OUT_OF_STOCK') {
    return true;
  }

  const status = String(product.status || '').toLowerCase();
  if (status.includes('out of stock')) {
    return true;
  }

  const stock = product.stockQuantity ?? product.stock_quantity ?? product.stock;
  if (stock != null && Number(stock) <= 0) {
    return true;
  }

  const variants = product.variants || [];
  if (variants.length) {
    return !variants.some((variant) => Number(variant.stock ?? 0) > 0);
  }

  return false;
}

export function sortProducts(items, sortId, scoreByProductId = {}) {
  const list = [...asArray(items)];

  if (sortId === 'price_asc') {
    return list.sort((left, right) => (left.price ?? 0) - (right.price ?? 0));
  }

  if (sortId === 'price_desc') {
    return list.sort((left, right) => (right.price ?? 0) - (left.price ?? 0));
  }

  if (sortId === 'newest') {
    return list.sort(
      (left, right) =>
        new Date(right.createdAt || right.created_at || 0).getTime()
        - new Date(left.createdAt || left.created_at || 0).getTime(),
    );
  }

  if (sortId === 'most_popular') {
    return list.sort((left, right) => {
      const leftScore = (scoreByProductId[left.id] ?? 0)
        + Number(left.reviewCount ?? left.review_count ?? 0);
      const rightScore = (scoreByProductId[right.id] ?? 0)
        + Number(right.reviewCount ?? right.review_count ?? 0);
      return rightScore - leftScore;
    });
  }

  if (sortId === 'highest_rated') {
    return list.sort(
      (left, right) =>
        (right.rating ?? right.average_rating ?? 0)
        - (left.rating ?? left.average_rating ?? 0),
    );
  }

  if (sortId === 'discount') {
    const discountOf = (product) => {
      const mrp = product.mrp ?? product.price ?? 0;
      const price = product.price ?? 0;
      if (!mrp || mrp <= price) return 0;
      return ((mrp - price) / mrp) * 100;
    };

    return list.sort((left, right) => discountOf(right) - discountOf(left));
  }

  return list.sort((left, right) => {
    const leftScore = scoreByProductId[left.id] ?? 0;
    const rightScore = scoreByProductId[right.id] ?? 0;
    return rightScore - leftScore;
  });
}

export function buildRecommendationScoreMap(recommendationItems = []) {
  return asArray(recommendationItems).reduce((scores, item) => {
    const productId = item?.product?.id;
    if (!productId) {
      return scores;
    }

    scores[productId] = Number(item.score ?? 0);
    return scores;
  }, {});
}
