import {
  AVATAR_LAYER_STACK,
  CATEGORY_TO_OUTFIT_SLOT,
  EMPTY_LAYERED_OUTFIT,
} from '../constants/avatar-layer.constants';
import { resolveOutfitSlotFromProductType } from '@/constants/product-types';
import { resolveProductOverlayUrl } from '../constants/avatar-assets.constants';
import { mapApiProductToOutfitItem } from './outfit-builder.util';

/**
 * @typedef {Object} AvatarRenderLayer
 * @property {string} layerId
 * @property {string} label
 * @property {string} overlayUrl
 * @property {number} zIndex
 * @property {string|null} productId
 * @property {string|null} categoryId
 */

/**
 * Build ordered render layers for the avatar compositor.
 * Only includes layers that have a visible image URL.
 *
 * @param {Object} params
 * @param {string|null} params.baseAvatarUrl
 * @param {import('../constants/avatar-layer.constants').EMPTY_LAYERED_OUTFIT} params.outfit
 * @returns {AvatarRenderLayer[]}
 */
export function buildAvatarRenderLayers({ baseAvatarUrl, outfit = EMPTY_LAYERED_OUTFIT }) {
  const layers = [];

  AVATAR_LAYER_STACK.forEach((definition) => {
    if (definition.layerId === 'base') {
      if (!baseAvatarUrl) {
        return;
      }

      layers.push({
        layerId: definition.layerId,
        label: definition.label,
        overlayUrl: baseAvatarUrl,
        zIndex: definition.zIndex,
        productId: null,
        categoryId: null,
      });
      return;
    }

    const item = outfit?.[definition.outfitSlot];

    if (!item?.overlayUrl) {
      return;
    }

    layers.push({
      layerId: definition.layerId,
      label: definition.label,
      overlayUrl: item.overlayUrl,
      zIndex: definition.zIndex,
      productId: item.id ?? null,
      categoryId: item.categoryId ?? definition.categoryId,
    });
  });

  return layers;
}

export function getOutfitSlotForCategory(categoryId, product) {
  const fromType = resolveOutfitSlotFromProductType(
    product?.productType || product?.product_type,
  );

  if (fromType) {
    return fromType;
  }

  return CATEGORY_TO_OUTFIT_SLOT[categoryId] ?? null;
}

export function mapApiProductToLayerItem(product, categoryId) {
  const slot = getOutfitSlotForCategory(categoryId, product);
  const mapped = mapApiProductToOutfitItem(product, categoryId);

  if (!mapped) {
    return null;
  }

  return {
    ...mapped,
    categoryId,
    overlayUrl: resolveProductOverlayUrl(product, categoryId),
  };
}

export function buildLayeredOutfitFromApi(outfitRecord) {
  if (!outfitRecord?.products) {
    return { ...EMPTY_LAYERED_OUTFIT };
  }

  const products = outfitRecord.products;

  const pick = (productId, categoryId) => (
    productId && products[productId]
      ? mapApiProductToLayerItem(products[productId], categoryId)
      : null
  );

  return {
    tshirt: pick(outfitRecord.selectedTshirtId, 't-shirts'),
    shirt: pick(outfitRecord.selectedShirtId, 'shirts'),
    jacket: pick(outfitRecord.selectedJacketId, 'jackets'),
    pants: pick(outfitRecord.selectedPantId, 'pants'),
    shoes: pick(outfitRecord.selectedShoesId, 'shoes'),
  };
}

export function buildLayeredOutfitPayload(outfit) {
  return {
    selectedTshirtId: outfit?.tshirt?.id ?? null,
    selectedShirtId: outfit?.shirt?.id ?? null,
    selectedJacketId: outfit?.jacket?.id ?? null,
    selectedPantId: outfit?.pants?.id ?? null,
    selectedShoesId: outfit?.shoes?.id ?? null,
  };
}

export function replaceCategorySelection(outfit, categoryId, product) {
  const slot = getOutfitSlotForCategory(categoryId, product);

  if (!slot) {
    return outfit;
  }

  return {
    ...outfit,
    [slot]: product
      ? { ...product, categoryId }
      : null,
  };
}

export function clearCategorySelection(outfit, categoryId) {
  return replaceCategorySelection(outfit, categoryId, null);
}

export function hasLayeredOutfitSelections(outfit) {
  return AVATAR_LAYER_STACK.some((definition) => {
    if (!definition.outfitSlot) {
      return false;
    }

    return Boolean(outfit?.[definition.outfitSlot]?.id);
  });
}

export function getSelectedItemForCategory(outfit, categoryId) {
  const slot = getOutfitSlotForCategory(categoryId);
  return slot ? outfit?.[slot] ?? null : null;
}

export function isCategoryItemSelected(outfit, categoryId, productId) {
  const selected = getSelectedItemForCategory(outfit, categoryId);
  return selected?.id === productId;
}
