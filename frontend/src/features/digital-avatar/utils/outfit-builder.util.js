import {
  CATEGORY_SLOT_MAP,
  OUTFIT_SLOTS,
} from '../constants/outfit-builder.constants';
import { EMPTY_LAYERED_OUTFIT } from '../constants/avatar-layer.constants';
import { resolveOutfitSlotFromProductType } from '@/constants/product-types';
import { resolveProductOverlayUrl } from '../constants/avatar-assets.constants';
import {
  getSelectedItemForCategory,
  isCategoryItemSelected,
} from './avatar-layer-engine';
import {
  resolveHairColorForAvatar,
  resolveSkinToneForAvatar,
} from './avatar-trait.util';
import { DEFAULT_CURRENCY, formatCurrency } from '@/utils/currency';

const CATEGORY_KEYWORDS = {
  't-shirts': ['tee', 't-shirt', 'tshirt', 'tank'],
  shirts: ['shirt', 'oxford', 'poplin', 'linen'],
  jackets: ['jacket', 'blazer', 'coat', 'fleece', 'outerwear'],
  pants: ['pant', 'jean', 'trouser', 'chino', 'denim'],
  shoes: ['shoe', 'sneaker', 'boot', 'loafer', 'trainer'],
};

const SUBCATEGORY_TO_AVATAR_TAB = {
  'men-t-shirts': 't-shirts',
  'men-shirts': 'shirts',
  'men-jackets': 'jackets',
  'men-jeans': 'pants',
  'men-trousers': 'pants',
  'men-suits': 'shirts',
  shoes: 'shoes',
  sneakers: 'shoes',
  sandals: 'shoes',
};

export function formatPrice(value, currency) {
  const amount = Number(value) || 0;
  return formatCurrency(amount, currency, { maximumFractionDigits: 0 });
}

export function getSelectedOutfitProducts(outfit) {
  return Object.values(outfit || {}).filter((item) => item?.id);
}

export function calculateOutfitTotal(outfit) {
  return getSelectedOutfitProducts(outfit).reduce(
    (sum, item) => sum + (Number(item?.price) || 0),
    0,
  );
}

export function resolveOutfitCurrency(outfit) {
  const selected = getSelectedOutfitProducts(outfit);
  return selected.find((item) => item?.currency)?.currency || DEFAULT_CURRENCY;
}

export function getPrimaryProductImage(product) {
  const primary = product?.images?.find((image) => image.is_primary);
  return (
    primary?.url
    || product?.images?.[0]?.url
    || product?.imageUrl
    || product?.image_url
    || product?.image
    || null
  );
}

export function inferProductCategory(product) {
  const productType = product?.productType || product?.product_type;
  const slot = resolveOutfitSlotFromProductType(productType);

  if (slot === 'tshirt') return 't-shirts';
  if (slot === 'shirt') return 'shirts';
  if (slot === 'jacket') return 'jackets';
  if (slot === 'pants') return 'pants';
  if (slot === 'shoes') return 'shoes';

  const subcategory = product?.subcategory;

  if (subcategory && SUBCATEGORY_TO_AVATAR_TAB[subcategory]) {
    return SUBCATEGORY_TO_AVATAR_TAB[subcategory];
  }

  const avatarCategory = product?.avatarCategory || product?.avatarWearable?.avatarCategory;

  if (avatarCategory === 'TOP') {
    const haystack = `${product?.name || ''} ${product?.subcategory || ''}`.toLowerCase();

    if (haystack.includes('shirt') && !haystack.includes('t-shirt') && !haystack.includes('tee')) {
      return 'shirts';
    }

    return 't-shirts';
  }

  if (avatarCategory === 'JACKET') {
    return 'jackets';
  }

  if (avatarCategory === 'BOTTOM') {
    return 'pants';
  }

  if (avatarCategory === 'FOOTWEAR') {
    return 'shoes';
  }

  const haystack = `${product?.name || ''} ${product?.title || ''} ${product?.description || ''}`
    .toLowerCase();

  for (const [categoryId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return categoryId;
    }
  }

  return null;
}

export function mapApiProductToOutfitItem(product, categoryId) {
  if (!product) {
    return null;
  }

  return {
    id: product.id,
    brand: product.brand?.name || product.brandName || product.brand_id || product.brand || 'BRAND',
    title: product.name || product.title,
    price: Number(product.price) || 0,
    currency: product.currency || DEFAULT_CURRENCY,
    rating: Number(product.rating) || null,
    color: product.color || '#8B5CF6',
    image: getPrimaryProductImage(product),
    imageUrl: getPrimaryProductImage(product),
    avatarOverlayUrl:
      product?.avatarOverlayUrl
      || product?.avatar_overlay_url
      || product?.avatarWearable?.avatarOverlayUrl
      || null,
    overlayUrl: resolveProductOverlayUrl(product, categoryId),
    overlayOrder: product.overlayOrder ?? product.avatarWearable?.overlayOrder ?? null,
    categoryId,
    source: 'api',
  };
}

export function buildCatalogFromApi(apiProducts = []) {
  const catalog = {
    't-shirts': [],
    shirts: [],
    jackets: [],
    pants: [],
    shoes: [],
  };

  apiProducts.forEach((product) => {
    const categoryId = inferProductCategory(product);

    if (!categoryId) {
      return;
    }

    const mapped = mapApiProductToOutfitItem(product, categoryId);

    if (!mapped) {
      return;
    }

    const existing = catalog[categoryId] || [];
    const duplicate = existing.some((item) => item.id === mapped.id);

    if (!duplicate) {
      catalog[categoryId] = [mapped, ...existing].slice(0, 8);
    }
  });

  return catalog;
}

export function mergeCatalogWithDefaults(apiProducts = []) {
  return buildCatalogFromApi(apiProducts);
}

export function getProductsForCategory(catalog, categoryId) {
  return catalog?.[categoryId] || [];
}

export function getSelectedProductForCategory(outfit, categoryId) {
  return getSelectedItemForCategory(outfit, categoryId);
}

export function isProductSelected(outfit, categoryId, productId) {
  return isCategoryItemSelected(outfit, categoryId, productId);
}

export function pickRandomItem(items = []) {
  if (!items.length) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)];
}

export function randomizeOutfit(catalog, currentOutfit = EMPTY_LAYERED_OUTFIT) {
  const pick = (categoryId, slot) => {
    const item = pickRandomItem(catalog[categoryId]);

    return item
      ? { ...item, categoryId }
      : currentOutfit[slot];
  };

  return {
    tshirt: pick('t-shirts', OUTFIT_SLOTS.TSHIRT),
    shirt: pick('shirts', OUTFIT_SLOTS.SHIRT),
    jacket: pick('jackets', OUTFIT_SLOTS.JACKET),
    pants: pick('pants', OUTFIT_SLOTS.PANTS),
    shoes: pick('shoes', OUTFIT_SLOTS.SHOES),
  };
}

export function getBrandTags(outfit) {
  return [
    outfit?.[OUTFIT_SLOTS.TSHIRT]?.brand,
    outfit?.[OUTFIT_SLOTS.SHIRT]?.brand,
    outfit?.[OUTFIT_SLOTS.JACKET]?.brand,
    outfit?.[OUTFIT_SLOTS.PANTS]?.brand,
    outfit?.[OUTFIT_SLOTS.SHOES]?.brand,
  ].filter(Boolean);
}

export function resolveSkinToneFromAnalysis(faceAnalysis, avatar) {
  return resolveSkinToneForAvatar(avatar, faceAnalysis);
}

export function resolveHairColorFromAnalysis(faceAnalysis, avatar) {
  return resolveHairColorForAvatar(avatar, faceAnalysis);
}
