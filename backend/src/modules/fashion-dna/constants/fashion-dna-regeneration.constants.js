export const REFRESH_SOURCES = {
  PROFILE_UPDATE: 'profile_update',
  BODY_ANALYSIS: 'body_analysis',
  FACE_ANALYSIS: 'face_analysis',
  WISHLIST_UPDATE: 'wishlist_update',
  PURCHASE: 'purchase',
  PRODUCT_VIEW: 'product_view',
  SEARCH: 'search',
  BROWSING_ACTIVITY: 'browsing_activity',
  CART_UPDATE: 'cart_update',
  CLOSET_UPDATE: 'closet_update',
  TRY_ON: 'try_on',
  SAVED_LOOK: 'saved_look',
  STYLIST: 'stylist',
};

export const BODY_ANALYSIS_PROFILE_FIELDS = [
  'height',
  'weight',
  'body_type',
  'skin_tone',
  'gender',
  'age',
];

export function resolveProfileRegenerationSource(dto) {
  const hasBodyFields = BODY_ANALYSIS_PROFILE_FIELDS.some(
    (field) => dto[field] !== undefined,
  );

  return hasBodyFields
    ? REFRESH_SOURCES.BODY_ANALYSIS
    : REFRESH_SOURCES.PROFILE_UPDATE;
}
