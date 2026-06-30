const FASHION_CATEGORY_TO_AVATAR_TAB = {
  tops: 't-shirts',
  top: 't-shirts',
  't-shirts': 't-shirts',
  tshirts: 't-shirts',
  shirts: 'shirts',
  jackets: 'jackets',
  outerwear: 'jackets',
  pants: 'pants',
  bottoms: 'pants',
  jeans: 'pants',
  trousers: 'pants',
  shoes: 'shoes',
  footwear: 'shoes',
  sneakers: 'shoes',
};

export function resolveSkinToneForAvatar(avatar, faceAnalysis) {
  return (
    avatar?.skinTone
    || faceAnalysis?.skinTone
    || faceAnalysis?.skin_tone
    || null
  );
}

export function resolveHairColorForAvatar(avatar, faceAnalysis) {
  const hairColor =
    avatar?.hairColor
    || faceAnalysis?.hairColor
    || faceAnalysis?.hair_color
    || null;

  if (!hairColor) {
    return null;
  }

  return String(hairColor).toLowerCase().replace(/\s+/g, '-');
}

export function resolveInitialCategoryFromStylePreferences(stylePreferences) {
  const preferred = stylePreferences?.preferredCategories || [];

  for (const category of preferred) {
    const key = String(category).toLowerCase().replace(/\s+/g, '-');

    if (FASHION_CATEGORY_TO_AVATAR_TAB[key]) {
      return FASHION_CATEGORY_TO_AVATAR_TAB[key];
    }
  }

  const affinity = stylePreferences?.categoryAffinity || {};
  const ranked = Object.entries(affinity)
    .sort((left, right) => Number(right[1]) - Number(left[1]))
    .map(([category]) => category.toLowerCase());

  for (const category of ranked) {
    const normalized = category.replace(/\s+/g, '-');

    if (FASHION_CATEGORY_TO_AVATAR_TAB[normalized]) {
      return FASHION_CATEGORY_TO_AVATAR_TAB[normalized];
    }
  }

  return null;
}

export function hasOutfitSelections(outfit) {
  return Boolean(
    outfit?.tshirt?.id
    || outfit?.shirt?.id
    || outfit?.jacket?.id
    || outfit?.pants?.id
    || outfit?.shoes?.id,
  );
}
