export const TRY_ON_CATEGORIES = [
  { id: 'pants', label: 'Pants', slot: 'pants', zIndex: 20 },
  { id: 't-shirts', label: 'T-Shirts', slot: 'tshirt', zIndex: 30 },
  { id: 'shirts', label: 'Shirts', slot: 'shirt', zIndex: 35 },
  { id: 'jackets', label: 'Jackets', slot: 'jacket', zIndex: 40 },
  { id: 'shoes', label: 'Shoes', slot: 'shoes', zIndex: 50 },
];

export const TRY_ON_LAYER_STACK = [
  { layerId: 'body', label: 'Body', zIndex: 10 },
  ...TRY_ON_CATEGORIES.map((category) => ({
    layerId: category.slot,
    categoryId: category.id,
    outfitSlot: category.slot,
    label: category.label,
    zIndex: category.zIndex,
  })),
];

export const EMPTY_TRY_ON_OUTFIT = {
  pants: null,
  tshirt: null,
  shirt: null,
  jacket: null,
  shoes: null,
};

export const BODY_TYPE_SCALING = {
  Athletic: { scaleX: 1.04, scaleY: 1.0 },
  Slim: { scaleX: 0.94, scaleY: 1.0 },
  Muscular: { scaleX: 1.08, scaleY: 1.02 },
  Average: { scaleX: 1.0, scaleY: 1.0 },
  Curvy: { scaleX: 1.02, scaleY: 1.0 },
  'Plus Size': { scaleX: 1.08, scaleY: 1.0 },
};

export const VIRTUAL_TRY_ON_CATALOG_CATEGORIES = [
  { id: 'shirts', label: 'Shirts' },
  { id: 't-shirts', label: 'T-Shirts' },
  { id: 'jackets', label: 'Jackets' },
  { id: 'pants', label: 'Pants' },
  { id: 'footwear', label: 'Footwear' },
];

export const VIRTUAL_TRY_ON_GLASS_CARD =
  'rounded-[24px] border border-white/10 bg-dashboard-surface/80 shadow-xl shadow-black/25 backdrop-blur-md';

export const VIRTUAL_TRY_ON_CARD_CLASS = VIRTUAL_TRY_ON_GLASS_CARD;

export const NO_BODY_IMAGE_MESSAGE =
  'Complete onboarding with a body photo to unlock Virtual Try-On.';
