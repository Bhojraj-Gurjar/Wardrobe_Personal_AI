import { inferProductCategory } from '@/features/digital-avatar/utils/outfit-builder.util';
import { EMPTY_LAYERED_OUTFIT } from '@/features/digital-avatar/constants/avatar-layer.constants';
import { mapApiProductToLayerItem } from '@/features/digital-avatar/utils/avatar-layer-engine';

const SLOT_TO_CATEGORY = {
  tshirt: 't-shirts',
  shirt: 'shirts',
  jacket: 'jackets',
  pants: 'pants',
  shoes: 'shoes',
};

function scoreProductForBlueprint(product, blueprint) {
  const haystack = `${product?.name || ''} ${product?.brand || ''} ${product?.subcategory || ''}`.toLowerCase();
  let score = 0;

  blueprint.keywords.forEach((keyword) => {
    if (haystack.includes(String(keyword).toLowerCase())) {
      score += 2;
    }
  });

  return score;
}

export function buildDefaultOutfitFromBlueprint(catalog = {}, blueprint) {
  if (!blueprint?.slots?.length) {
    return { ...EMPTY_LAYERED_OUTFIT };
  }

  const next = { ...EMPTY_LAYERED_OUTFIT };

  blueprint.slots.forEach((slot) => {
    const categoryId = SLOT_TO_CATEGORY[slot];
    const categoryProducts = catalog[categoryId] || [];

    const ranked = [...categoryProducts].sort(
      (left, right) => scoreProductForBlueprint(right, blueprint)
        - scoreProductForBlueprint(left, blueprint),
    );

    const best = ranked[0];
    if (!best) return;

    const resolvedCategory = categoryId || inferProductCategory(best);
    const layerItem = mapApiProductToLayerItem(best, resolvedCategory);
    if (layerItem) {
      next[slot] = layerItem;
    }
  });

  return next;
}

export function hasAnyOutfitSelection(outfit) {
  return Boolean(
    outfit?.tshirt?.id
    || outfit?.shirt?.id
    || outfit?.jacket?.id
    || outfit?.pants?.id
    || outfit?.shoes?.id,
  );
}
