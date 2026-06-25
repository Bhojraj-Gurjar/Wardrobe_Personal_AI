/** Signal strategies used to score catalog items. */
export const RECOMMENDATION_SIGNAL_TYPES = {
  FACE_BASED: 'face_based',
  BODY_BASED: 'body_based',
  SKIN_TONE_BASED: 'skin_tone_based',
  BUDGET_BASED: 'budget_based',
  BEHAVIOR_BASED: 'behavior_based',
  SIMILAR_USER_BASED: 'similar_user_based',
};

/** High-level recommendation delivery modes. */
export const RECOMMENDATION_TYPES = {
  DAILY: 'daily',
  SEASONAL: 'seasonal',
  EVENT: 'event',
  TRENDING: 'trending',
};

export const RECOMMENDATION_SOURCES = {
  QDRANT: 'qdrant',
  POSTGRESQL: 'postgresql',
  HYBRID: 'hybrid',
};

export const RECOMMENDATION_FACTORS = {
  BODY_TYPE: 'body_type',
  SKIN_TONE: 'skin_tone',
  FACE_SHAPE: 'face_shape',
  HAIR_STYLE: 'hair_style',
  BEARD_STYLE: 'beard_style',
  FAVORITE_BRANDS: 'favorite_brands',
  FAVORITE_COLORS: 'favorite_colors',
  SHOPPING_HISTORY: 'shopping_history',
  WISHLIST: 'wishlist',
  BUDGET: 'budget',
  BEHAVIOR: 'behavior',
  SIMILAR_USERS: 'similar_users',
  SEASONAL: 'seasonal',
  EVENT: 'event',
  TRENDING: 'trending',
};

export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50;

export const EVENT_OCCASION_KEYWORDS = {
  office: ['office', 'work', 'business', 'professional', 'interview', 'formal shirt', 'blazer'],
  wedding: ['wedding', 'formal', 'black-tie', 'ceremony', 'ethnic', 'sherwani'],
  party: ['party', 'night-out', 'date-night', 'celebration', 'sequin', 'cocktail'],
  travel: ['travel', 'vacation', 'comfort', 'layer', 'jacket', 'backpack', 'resort'],
  casual: ['casual', 'weekend', 'everyday', 'relaxed', 'tee', 't-shirt'],
  gym: ['gym', 'sport', 'athletic', 'training', 'performance'],
};

export const SEASON_TAGS = {
  summer: ['summer', 'linen', 'breathable', 'light', 'cotton', 't-shirt', 'tee', 'short sleeve', 'pastel'],
  winter: ['winter', 'warm', 'jacket', 'hoodie', 'wool', 'fleece', 'coat', 'layer'],
  monsoon: ['monsoon', 'rain', 'quick dry', 'quick-dry', 'water resistant', 'nylon', 'windbreaker'],
  spring: ['spring', 'light-layer', 'pastel'],
  autumn: ['autumn', 'fall', 'layering', 'earth-tone'],
};
