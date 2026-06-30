export const RECOMMENDATION_SECTION_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'daily', label: 'Daily' },
  { id: 'seasonal', label: 'Seasonal' },
  { id: 'trending', label: 'Trending' },
  { id: 'outfits', label: 'Complete Outfits' },
];

export const RECOMMENDATION_CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  {
    id: 'tops',
    label: 'Tops',
    keywords: ['t-shirt', 'tshirt', 'shirt', 'top', 'tops', 'blouse', 'tee'],
  },
  {
    id: 'bottoms',
    label: 'Bottoms',
    keywords: ['pant', 'pants', 'jean', 'jeans', 'trouser', 'short', 'skirt', 'bottom'],
  },
  {
    id: 'outerwear',
    label: 'Outerwear',
    keywords: ['jacket', 'coat', 'blazer', 'outerwear', 'hoodie', 'sweater'],
  },
  {
    id: 'footwear',
    label: 'Footwear',
    keywords: ['shoe', 'shoes', 'sneaker', 'boot', 'footwear', 'sandal'],
  },
  {
    id: 'accessories',
    label: 'Accessories',
    keywords: ['accessory', 'accessories', 'bag', 'belt', 'hat', 'watch', 'jewelry'],
  },
];

export const RECOMMENDATION_SORT_OPTIONS = [
  { id: 'match', label: 'Best match' },
  { id: 'price_asc', label: 'Price: low to high' },
  { id: 'price_desc', label: 'Price: high to low' },
  { id: 'newest', label: 'Newest' },
];

export const RECOMMENDATION_TAG_STYLES = {
  purple: 'bg-[#8B5CF6]/95 text-white',
  orange: 'bg-[#F59E0B]/95 text-white',
  green: 'bg-[#22C55E]/95 text-white',
  teal: 'bg-[#14B8A6]/95 text-white',
};

export const RECOMMENDATION_SECTION_META = {
  daily: {
    id: 'daily',
    title: 'Daily Recommendations',
    subtitle: 'Hand-picked for today from your Fashion DNA, body type, and style preferences',
    featureBadge: { label: 'Perfect for Today', tone: 'purple' },
    reasonFallback: 'Based on your style profile',
  },
  seasonal: {
    id: 'seasonal',
    title: 'Seasonal Picks',
    subtitle: 'Weather-ready styles for the current season',
    featureBadge: { label: 'Seasonal', tone: 'teal' },
    reasonFallback: 'Great for the current season',
  },
  trending: {
    id: 'trending',
    title: 'Trending Now',
    subtitle: 'Most viewed and popular picks across Wardrobe AI',
    featureBadge: { label: 'Trending', tone: 'orange' },
    reasonFallback: 'Trending among users like you',
  },
};

export const MATCH_FACTOR_REASONS = {
  favorite_brands: 'From brands you love',
  body_type: 'Matches your body type',
  favorite_colors: 'Matches your color palette',
  seasonal: 'Recommended for this season',
  trending: 'Trending among users like you',
  behavior: 'Based on your browsing activity',
  wishlist: 'Similar to your wishlist',
  shopping_history: 'Aligned with your shopping history',
  skin_tone: 'Complements your skin tone',
  face_shape: 'Complements your face shape',
  budget: 'Fits your budget',
  similar_users: 'Popular among similar users',
  event: 'Suited for your occasion',
  hair_style: 'Complements your hair style',
  beard_style: 'Works with your beard style',
};
