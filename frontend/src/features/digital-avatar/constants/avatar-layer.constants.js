/**
 * Fixed compositing order for the avatar rendering engine.
 * Lower zIndex renders behind higher zIndex.
 */
export const AVATAR_LAYER_STACK = [
  {
    layerId: 'base',
    categoryId: null,
    outfitSlot: null,
    label: 'Base Avatar',
    zIndex: 10,
  },
  {
    layerId: 'tshirt',
    categoryId: 't-shirts',
    outfitSlot: 'tshirt',
    label: 'T-Shirt',
    zIndex: 20,
  },
  {
    layerId: 'shirt',
    categoryId: 'shirts',
    outfitSlot: 'shirt',
    label: 'Shirt',
    zIndex: 30,
  },
  {
    layerId: 'jacket',
    categoryId: 'jackets',
    outfitSlot: 'jacket',
    label: 'Jacket',
    zIndex: 40,
  },
  {
    layerId: 'pants',
    categoryId: 'pants',
    outfitSlot: 'pants',
    label: 'Pant',
    zIndex: 50,
  },
  {
    layerId: 'shoes',
    categoryId: 'shoes',
    outfitSlot: 'shoes',
    label: 'Shoes',
    zIndex: 60,
  },
];

export const AVATAR_LAYER_Z_INDEX = Object.fromEntries(
  AVATAR_LAYER_STACK.map((layer) => [layer.layerId, layer.zIndex]),
);

export const CATEGORY_TO_OUTFIT_SLOT = Object.fromEntries(
  AVATAR_LAYER_STACK
    .filter((layer) => layer.categoryId)
    .map((layer) => [layer.categoryId, layer.outfitSlot]),
);

export const EMPTY_LAYERED_OUTFIT = {
  tshirt: null,
  shirt: null,
  jacket: null,
  pants: null,
  shoes: null,
};
