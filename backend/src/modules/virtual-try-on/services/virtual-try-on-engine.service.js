import {
  BODY_TYPE_SCALING,
  CATEGORY_TO_TRY_ON_SLOT,
  DEFAULT_BODY_SCALING,
  EMPTY_TRY_ON_OUTFIT,
  TRY_ON_LAYER_STACK,
} from '../constants/try-on-layer.constants';
import {
  inferProductType,
  resolveTryOnSlotFromProductType,
} from '../../products/constants/product-type.constants';

function resolveOverlayUrl(product) {
  return (
    product?.avatarOverlayUrl
    ?? product?.avatar_overlay_url
    ?? product?.imageUrl
    ?? product?.image_url
    ?? null
  );
}

export function mapProductToTryOnLayer(product, categoryId) {
  if (!product?.id) {
    return null;
  }

  const productType = product.productType ?? product.product_type ?? inferProductType(product);
  const slot = resolveTryOnSlotFromProductType(productType)
    ?? CATEGORY_TO_TRY_ON_SLOT[categoryId];

  if (!slot) {
    return null;
  }

  return {
    id: product.id,
    name: product.name,
    category: categoryId,
    categoryId,
    productType,
    slot,
    imageUrl: product.imageUrl ?? product.image_url ?? null,
    overlayUrl: resolveOverlayUrl(product),
    color: product.color ?? null,
    fit: product.fitType ?? product.fit_type ?? null,
    brand: product.brand ?? null,
    avatarCategory: product.avatarCategory ?? product.avatar_category ?? null,
    overlayOrder: product.overlayOrder ?? product.overlay_order ?? null,
  };
}

export function resolveBodyScaling(bodyAnalysis = {}, profile = {}) {
  const bodyType = bodyAnalysis?.bodyType
    ?? bodyAnalysis?.body_type
    ?? profile?.body_type
    ?? profile?.bodyType
    ?? null;

  const base = BODY_TYPE_SCALING[bodyType] ?? DEFAULT_BODY_SCALING;

  const shoulder = Number(bodyAnalysis?.shoulderWidth ?? bodyAnalysis?.shoulder_width);
  const waist = Number(bodyAnalysis?.waist);
  const hip = Number(bodyAnalysis?.hip);
  const height = Number(bodyAnalysis?.height ?? profile?.height);

  const measurementScale = {
    shoulder: Number.isFinite(shoulder) && shoulder > 0
      ? Math.min(1.15, Math.max(0.85, shoulder / 45))
      : 1,
    waist: Number.isFinite(waist) && waist > 0
      ? Math.min(1.15, Math.max(0.85, waist / 80))
      : 1,
    hip: Number.isFinite(hip) && hip > 0
      ? Math.min(1.15, Math.max(0.85, hip / 95))
      : 1,
    height: Number.isFinite(height) && height > 0
      ? Math.min(1.08, Math.max(0.92, height / 175))
      : 1,
  };

  return {
    bodyType,
    scaleX: base.width * measurementScale.shoulder,
    scaleY: base.height * measurementScale.height,
    shoulderScale: base.shoulder * measurementScale.shoulder,
    waistScale: base.waist * measurementScale.waist,
    hipScale: measurementScale.hip,
  };
}

export function buildTryOnRenderLayers({
  bodyImageUrl,
  transparentImageUrl,
  outfit = EMPTY_TRY_ON_OUTFIT,
  scaling = DEFAULT_BODY_SCALING,
}) {
  const layers = [];
  const bodyUrl = bodyImageUrl || transparentImageUrl;

  if (bodyUrl) {
    layers.push({
      layerId: 'body',
      label: 'Body',
      overlayUrl: bodyUrl,
      zIndex: 10,
      productId: null,
      transform: {
        scaleX: 1,
        scaleY: 1,
      },
    });
  }

  for (const definition of TRY_ON_LAYER_STACK) {
    if (definition.layerId === 'body') {
      continue;
    }

    const item = outfit?.[definition.outfitSlot];

    if (!item?.overlayUrl) {
      continue;
    }

    layers.push({
      layerId: definition.layerId,
      label: definition.label,
      overlayUrl: item.overlayUrl,
      zIndex: definition.zIndex,
      productId: item.id ?? null,
      categoryId: definition.categoryId,
      transform: {
        scaleX: scaling.scaleX ?? scaling.width ?? 1,
        scaleY: scaling.scaleY ?? scaling.height ?? 1,
        shoulderScale: scaling.shoulderScale ?? 1,
        waistScale: scaling.waistScale ?? 1,
      },
    });
  }

  return layers;
}

export function buildOutfitFromProductIds(productsById, selection = {}) {
  const outfit = { ...EMPTY_TRY_ON_OUTFIT };

  for (const [categoryId, productId] of Object.entries(selection)) {
    const slot = CATEGORY_TO_TRY_ON_SLOT[categoryId];

    if (!slot || !productId || !productsById[productId]) {
      continue;
    }

    outfit[slot] = mapProductToTryOnLayer(productsById[productId], categoryId);
  }

  return outfit;
}

export function outfitToSelection(outfit) {
  const selection = {};

  for (const [categoryId, slot] of Object.entries(CATEGORY_TO_TRY_ON_SLOT)) {
    const item = outfit?.[slot];

    if (item?.id) {
      selection[categoryId] = item.id;
    }
  }

  return selection;
}

export function replaceTryOnSelection(outfit, categoryId, product) {
  const slot = CATEGORY_TO_TRY_ON_SLOT[categoryId];

  if (!slot) {
    return outfit;
  }

  return {
    ...outfit,
    [slot]: product ? mapProductToTryOnLayer(product, categoryId) : null,
  };
}

export function hasTryOnSelections(outfit) {
  return Object.values(outfit || {}).some((item) => Boolean(item?.id));
}

export function scoreProductForFashionDna(product, fashionDna) {
  if (!fashionDna || !product) {
    return 0;
  }

  let score = 0;
  const colorAffinity = fashionDna.colorAffinity ?? fashionDna.color_affinity ?? {};
  const preferences = fashionDna.preferenceTraits ?? fashionDna.preference_traits ?? {};
  const favoriteColors = Array.isArray(preferences.favorite_colors)
    ? preferences.favorite_colors
    : [];
  const productColor = String(product.color || '').toLowerCase();

  if (productColor) {
    for (const [color, weight] of Object.entries(colorAffinity)) {
      if (productColor.includes(String(color).toLowerCase())) {
        score += Number(weight) * 10;
      }
    }

    for (const favorite of favoriteColors) {
      if (productColor.includes(String(favorite).toLowerCase())) {
        score += 5;
      }
    }
  }

  const budgetRange = String(fashionDna.budgetRange ?? fashionDna.budget_range ?? '');
  const price = Number(product.price);

  if (budgetRange === 'BUDGET' && price <= 60) {
    score += 3;
  } else if (budgetRange === 'MID_RANGE' && price > 40 && price <= 150) {
    score += 3;
  } else if (budgetRange === 'PREMIUM' && price > 120) {
    score += 3;
  }

  return score;
}
