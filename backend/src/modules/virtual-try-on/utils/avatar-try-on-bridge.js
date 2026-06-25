import {
  buildOutfitFromProductIds,
  buildTryOnRenderLayers,
  hasTryOnSelections,
  mapProductToTryOnLayer,
  outfitToSelection,
  replaceTryOnSelection,
  resolveBodyScaling,
  scoreProductForFashionDna,
} from '../services/virtual-try-on-engine.service';

const AVATAR_LAYER_STACK = [
  { layerId: 'base', outfitSlot: null, zIndex: 10 },
  { layerId: 'tshirt', outfitSlot: 'tshirt', zIndex: 20 },
  { layerId: 'shirt', outfitSlot: 'shirt', zIndex: 30 },
  { layerId: 'jacket', outfitSlot: 'jacket', zIndex: 40 },
  { layerId: 'pants', outfitSlot: 'pants', zIndex: 50 },
  { layerId: 'shoes', outfitSlot: 'shoes', zIndex: 60 },
];

export function buildAvatarRenderLayers({ baseAvatarUrl, outfit }) {
  const layers = [];

  for (const definition of AVATAR_LAYER_STACK) {
    if (definition.layerId === 'base') {
      if (!baseAvatarUrl) {
        continue;
      }

      layers.push({
        layerId: definition.layerId,
        overlayUrl: baseAvatarUrl,
        zIndex: definition.zIndex,
        productId: null,
      });
      continue;
    }

    const item = outfit?.[definition.outfitSlot];

    if (!item?.overlayUrl) {
      continue;
    }

    layers.push({
      layerId: definition.layerId,
      overlayUrl: item.overlayUrl,
      zIndex: definition.zIndex,
      productId: item.id ?? null,
    });
  }

  return layers;
}

export {
  buildOutfitFromProductIds,
  buildTryOnRenderLayers,
  hasTryOnSelections,
  mapProductToTryOnLayer,
  outfitToSelection,
  replaceTryOnSelection,
  resolveBodyScaling,
  scoreProductForFashionDna,
};
