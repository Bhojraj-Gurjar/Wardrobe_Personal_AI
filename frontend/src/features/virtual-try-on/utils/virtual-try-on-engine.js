import {
  EMPTY_TRY_ON_OUTFIT,
  TRY_ON_LAYER_STACK,
} from '../constants/virtual-try-on.constants';

import { getProductImage } from '@/utils/product-image';

export function mapProductToLayerItem(product) {
  if (!product?.id) {
    return null;
  }

  return {
    id: product.id,
    name: product.name,
    categoryId: product.categoryId ?? product.category,
    overlayUrl:
      product.overlayUrl
      ?? product.avatarOverlayUrl
      ?? getProductImage(product, { placeholder: null })
      ?? null,
    color: product.color ?? null,
    fit: product.fit ?? product.fitType ?? null,
    brand: product.brand ?? null,
  };
}

export function buildTryOnRenderLayers({
  bodyImageUrl,
  transparentImageUrl,
  outfit = EMPTY_TRY_ON_OUTFIT,
  scaling = { scaleX: 1, scaleY: 1 },
}) {
  const layers = [];
  const bodyUrl = transparentImageUrl || bodyImageUrl;

  if (bodyUrl) {
    layers.push({
      layerId: 'body',
      overlayUrl: bodyUrl,
      zIndex: 10,
      transform: { scaleX: 1, scaleY: 1 },
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
      transform: {
        scaleX: scaling.scaleX ?? 1,
        scaleY: scaling.scaleY ?? 1,
      },
    });
  }

  return layers;
}

export function hasTryOnSelections(outfit) {
  return Object.values(outfit || {}).some((item) => Boolean(item?.id));
}

export function replaceTryOnSelection(outfit, categoryId, product) {
  const category = product?.categoryId ?? categoryId;
  const slotMap = {
    pants: 'pants',
    't-shirts': 'tshirt',
    shirts: 'shirt',
    jackets: 'jacket',
    shoes: 'shoes',
  };
  const slot = slotMap[category];

  if (!slot) {
    return outfit;
  }

  return {
    ...outfit,
    [slot]: product ? mapProductToLayerItem(product) : null,
  };
}
