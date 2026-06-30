export const TRY_ON_OUTFIT_SLOTS = ['pants', 'tshirt', 'shirt', 'jacket', 'dress'];

const INNER_TOP_SLOTS = new Set(['tshirt', 'shirt']);

export function normalizeOutfitSlots(slots) {
  const source = slots && typeof slots === 'object' && !Array.isArray(slots)
    ? slots
    : {};

  return TRY_ON_OUTFIT_SLOTS.reduce((accumulator, slot) => {
    accumulator[slot] = source[slot] || null;
    return accumulator;
  }, {});
}

export function getSelectedOutfitProductIds(slots = {}) {
  return TRY_ON_OUTFIT_SLOTS
    .map((slot) => slots[slot])
    .filter(Boolean);
}

export function toggleOutfitSlotSelection(currentSlots, product) {
  const slot = product?.tryOnSlot;

  if (!slot || !product?.id) {
    return normalizeOutfitSlots(currentSlots);
  }

  const next = normalizeOutfitSlots(currentSlots);
  const productId = String(product.id);

  if (next[slot] === productId) {
    next[slot] = null;
    return next;
  }

  if (INNER_TOP_SLOTS.has(slot)) {
    if (slot === 'tshirt') {
      next.shirt = null;
    }
    if (slot === 'shirt') {
      next.tshirt = null;
    }
  }

  next[slot] = productId;
  return next;
}

export function resolveOutfitSelectionFromProducts(products = [], slots = {}) {
  const byId = new Map(products.map((product) => [String(product.id), product]));

  return TRY_ON_OUTFIT_SLOTS
    .map((slot) => {
      const productId = slots[slot];
      const product = productId ? byId.get(String(productId)) : null;
      return product ? { slot, product } : null;
    })
    .filter(Boolean);
}

export function inferClientTryOnMode(slots = {}, products = []) {
  const selected = resolveOutfitSelectionFromProducts(products, slots);

  if (!selected.length) {
    return null;
  }

  const regions = new Set(
    selected.map(({ product }) => product?.tryOnRegion || 'upper'),
  );

  if (regions.has('dress')) {
    return 'full';
  }

  if (regions.has('lower') && regions.has('upper')) {
    return 'full';
  }

  if (regions.has('lower')) {
    return 'lower';
  }

  return 'upper';
}

export function describeClientTryOnMode(mode) {
  switch (mode) {
    case 'lower':
      return 'Lower-body try-on';
    case 'full':
      return 'Full outfit try-on';
    case 'upper':
      return 'Upper-body try-on';
    default:
      return 'AI Virtual Try-On';
  }
}

export const TRY_ON_SLOT_LABELS = {
  pants: 'Bottom',
  tshirt: 'Top',
  shirt: 'Shirt',
  jacket: 'Jacket',
  dress: 'Outfit',
};
