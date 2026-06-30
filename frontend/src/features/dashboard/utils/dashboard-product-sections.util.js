import {
  buildOutfitSuggestions,
  filterRecommendationsByCategory,
} from '@/features/ai/utils/recommendations.util';
import {
  asArray,
  buildRecommendationScoreMap,
  resolveRecommendationItems,
  sortProducts,
} from '@/features/products/utils/product-catalog.utils';
import { readRecentlyViewedIds } from '@/features/products/utils/product-details.utils';

const SECTION_LIMIT = 12;

function toRecommendationItem(product, score) {
  if (!product?.id) {
    return null;
  }

  return {
    product,
    score: score ?? 78,
  };
}

function uniqueRecommendationItems(items, limit = SECTION_LIMIT) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const id = item?.product?.id;
    if (!id || seen.has(id)) {
      continue;
    }

    seen.add(id);
    result.push(item);
    if (result.length >= limit) {
      break;
    }
  }

  return result;
}

function productsToItems(products, scoreMap = {}, fallbackScore = 76) {
  return uniqueRecommendationItems(
    asArray(products).map((product) => toRecommendationItem(
      product,
      scoreMap[product.id] ?? fallbackScore,
    )).filter(Boolean),
  );
}

function priceAtPercentile(products, percentile) {
  const prices = asArray(products)
    .map((product) => Number(product?.price) || 0)
    .filter((price) => price > 0)
    .sort((left, right) => left - right);

  if (!prices.length) {
    return 0;
  }

  const index = Math.min(
    prices.length - 1,
    Math.max(0, Math.floor((percentile / 100) * (prices.length - 1))),
  );

  return prices[index];
}

function productHaystack(product) {
  return [
    product?.category,
    product?.subcategory,
    product?.productType,
    product?.product_type,
    product?.brand,
    ...(Array.isArray(product?.styleTags) ? product.styleTags : []),
    ...(Array.isArray(product?.occasionTags) ? product.occasionTags : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function matchesKeywords(product, keywords = []) {
  const haystack = productHaystack(product);
  return keywords.some((keyword) => haystack.includes(keyword));
}

function mapIdsToProducts(ids, productPool, scoreMap) {
  const byId = new Map(asArray(productPool).map((product) => [product.id, product]));

  return uniqueRecommendationItems(
    ids
      .map((id) => toRecommendationItem(byId.get(id), scoreMap[id]))
      .filter((item) => item?.product),
  );
}

export const DASHBOARD_PRODUCT_SECTIONS = [
  {
    id: 'recommended',
    title: 'Recommended For You',
    subtitle: 'Curated from your Fashion DNA, face and body analysis, and style preferences',
    mode: 'default',
    featureBadge: { label: 'For You', tone: 'purple' },
  },
  {
    id: 'fashion-dna',
    title: 'Based On Your Fashion DNA',
    subtitle: 'Styles aligned with your confidence score, palette, and signature look',
    mode: 'default',
    featureBadge: { label: 'DNA Match', tone: 'purple' },
  },
  {
    id: 'trending',
    title: 'Trending Now',
    subtitle: 'Popular picks across Wardrobe AI right now',
    mode: 'trending',
    featureBadge: { label: 'Trending', tone: 'orange' },
  },
  {
    id: 'new-arrivals',
    title: 'New Arrivals',
    subtitle: 'Fresh drops added to the catalog',
    mode: 'default',
    featureBadge: { label: 'New', tone: 'teal' },
  },
  {
    id: 'best-sellers',
    title: 'Best Sellers',
    subtitle: 'Top-rated favorites loved by the community',
    mode: 'default',
    featureBadge: { label: 'Bestseller', tone: 'teal' },
  },
  {
    id: 'recently-viewed',
    title: 'Recently Viewed',
    subtitle: 'Pick up where you left off',
    mode: 'default',
    featureBadge: null,
  },
  {
    id: 'continue-shopping',
    title: 'Continue Shopping',
    subtitle: 'Inspired by your browsing history and saved interests',
    mode: 'default',
    featureBadge: { label: 'Continue', tone: 'purple' },
  },
  {
    id: 'similar-closet',
    title: 'Similar To Your Closet',
    subtitle: 'Pieces that complement what you already own',
    mode: 'default',
    featureBadge: { label: 'Closet', tone: 'teal' },
  },
  {
    id: 'recommended-outfits',
    title: 'Recommended Outfits',
    subtitle: 'Complete looks styled around your profile',
    mode: 'default',
    featureBadge: { label: 'Outfit', tone: 'purple' },
  },
  {
    id: 'shoes',
    title: 'Shoes You May Like',
    subtitle: 'Footwear matched to your style DNA',
    mode: 'default',
    featureBadge: { label: 'Footwear', tone: 'orange' },
  },
  {
    id: 'accessories',
    title: 'Accessories For You',
    subtitle: 'Finishing touches for your wardrobe',
    mode: 'default',
    featureBadge: { label: 'Accessories', tone: 'teal' },
  },
  {
    id: 'premium',
    title: 'Premium Collection',
    subtitle: 'Elevated pieces for a refined wardrobe',
    mode: 'default',
    featureBadge: { label: 'Premium', tone: 'purple' },
  },
  {
    id: 'seasonal',
    title: 'Seasonal Picks',
    subtitle: 'Weather-ready styles for right now',
    mode: 'seasonal',
    featureBadge: { label: 'Seasonal', tone: 'teal' },
  },
  {
    id: 'budget',
    title: 'Budget Friendly',
    subtitle: 'Smart style picks that respect your budget',
    mode: 'default',
    featureBadge: { label: 'Value', tone: 'teal' },
  },
  {
    id: 'luxury',
    title: 'Luxury Collection',
    subtitle: 'Statement pieces for a luxury-forward aesthetic',
    mode: 'default',
    featureBadge: { label: 'Luxury', tone: 'purple' },
  },
];

export function resolveDashboardSectionItems(sectionId, context) {
  const {
    defaultItems = [],
    trendingItems = [],
    seasonalItems = [],
    products = [],
    scoreMap = {},
    wishlistProductIds = [],
    purchasedItems = [],
    favoriteBrands = [],
    outfitSuggestions = [],
  } = context;

  const productPool = asArray(products);
  const recentlyViewedIds = typeof window !== 'undefined' ? readRecentlyViewedIds() : [];

  switch (sectionId) {
    case 'recommended':
      return uniqueRecommendationItems(defaultItems);

    case 'fashion-dna': {
      const dnaItems = defaultItems.filter((item) => {
        const factors = item?.matched_factors || item?.matchedFactors || [];
        return factors.some((factor) => [
          'favorite_brands',
          'favorite_colors',
          'body_type',
          'skin_tone',
          'face_shape',
          'hair_style',
        ].includes(factor));
      });

      return uniqueRecommendationItems(dnaItems.length ? dnaItems : defaultItems);
    }

    case 'trending':
      return uniqueRecommendationItems(trendingItems.length ? trendingItems : defaultItems);

    case 'new-arrivals':
      return productsToItems(
        sortProducts(productPool, 'newest', scoreMap),
        scoreMap,
        74,
      );

    case 'best-sellers':
      return productsToItems(
        sortProducts(productPool, 'most_popular', scoreMap),
        scoreMap,
        82,
      );

    case 'recently-viewed':
      return mapIdsToProducts(recentlyViewedIds, productPool, scoreMap);

    case 'continue-shopping': {
      const recent = mapIdsToProducts(recentlyViewedIds, productPool, scoreMap);
      const wishlist = uniqueRecommendationItems(
        wishlistProductIds
          .map((id) => toRecommendationItem(
            productPool.find((product) => product.id === id),
            scoreMap[id] ?? 80,
          ))
          .filter((item) => item?.product),
      );

      return uniqueRecommendationItems([...recent, ...wishlist, ...defaultItems]);
    }

    case 'similar-closet': {
      const closetCategories = new Set(
        purchasedItems.map((item) => String(item?.category || '').toLowerCase()).filter(Boolean),
      );
      const closetBrands = new Set(
        purchasedItems.map((item) => String(item?.brand || '').toLowerCase()).filter(Boolean),
      );

      const closetMatches = productPool.filter((product) => {
        const category = String(product?.category || '').toLowerCase();
        const brand = String(product?.brand || '').toLowerCase();
        return closetCategories.has(category) || closetBrands.has(brand);
      });

      const preferredBrandMatches = favoriteBrands.length
        ? productPool.filter((product) => favoriteBrands.some(
          (brand) => String(product?.brand || '').toLowerCase() === String(brand).toLowerCase(),
        ))
        : [];

      return uniqueRecommendationItems([
        ...productsToItems(closetMatches, scoreMap, 79),
        ...productsToItems(preferredBrandMatches, scoreMap, 77),
        ...defaultItems.filter((item) => {
          const factors = item?.matched_factors || item?.matchedFactors || [];
          return factors.includes('body_type') || factors.includes('wishlist');
        }),
      ]);
    }

    case 'recommended-outfits': {
      const outfitProducts = outfitSuggestions.flatMap((outfit) => outfit?.products || []);
      return uniqueRecommendationItems(
        outfitProducts.map((product, index) => toRecommendationItem(
          product,
          scoreMap[product.id] ?? 88 - index,
        )).filter(Boolean),
      );
    }

    case 'shoes':
      return uniqueRecommendationItems([
        ...filterRecommendationsByCategory(defaultItems, 'footwear'),
        ...productsToItems(
          productPool.filter((product) => matchesKeywords(product, [
            'shoe', 'shoes', 'sneaker', 'boot', 'footwear', 'sandal',
          ])),
          scoreMap,
          75,
        ),
      ]);

    case 'accessories':
      return uniqueRecommendationItems([
        ...filterRecommendationsByCategory(defaultItems, 'accessories'),
        ...productsToItems(
          productPool.filter((product) => matchesKeywords(product, [
            'accessory', 'accessories', 'bag', 'belt', 'hat', 'watch', 'jewelry', 'eyewear',
          ])),
          scoreMap,
          75,
        ),
      ]);

    case 'premium': {
      const threshold = priceAtPercentile(productPool, 70);
      return productsToItems(
        productPool.filter((product) => Number(product?.price) >= threshold),
        scoreMap,
        84,
      );
    }

    case 'seasonal':
      return uniqueRecommendationItems(seasonalItems.length ? seasonalItems : defaultItems);

    case 'budget': {
      const threshold = priceAtPercentile(productPool, 35);
      return productsToItems(
        sortProducts(
          productPool.filter((product) => Number(product?.price) <= threshold || threshold === 0),
          'price_asc',
          scoreMap,
        ),
        scoreMap,
        72,
      );
    }

    case 'luxury': {
      const threshold = priceAtPercentile(productPool, 85);
      return productsToItems(
        productPool.filter((product) => {
          const price = Number(product?.price) || 0;
          const haystack = productHaystack(product);
          return price >= threshold || haystack.includes('luxury') || haystack.includes('couture');
        }),
        scoreMap,
        86,
      );
    }

    default:
      return uniqueRecommendationItems(defaultItems);
  }
}

export function buildDashboardFeedContext({
  recommendations,
  trending,
  seasonal,
  products,
  wishlistItems,
  purchasedItems,
  favoriteBrands,
  fashionDna,
  faceAnalysis,
  bodyAnalysis,
}) {
  const defaultItems = resolveRecommendationItems(recommendations);
  const trendingItems = resolveRecommendationItems(trending);
  const seasonalItems = resolveRecommendationItems(seasonal);
  const productPool = asArray(products?.items ?? products);
  const scoreMap = buildRecommendationScoreMap([
    ...defaultItems,
    ...trendingItems,
    ...seasonalItems,
  ]);

  const outfitSuggestions = buildOutfitSuggestions({
    items: defaultItems,
    fashionDna,
    faceAnalysis,
    bodyAnalysis,
    maxOutfits: 4,
  });

  return {
    defaultItems,
    trendingItems,
    seasonalItems,
    products: productPool,
    scoreMap,
    wishlistProductIds: asArray(wishlistItems)
      .map((item) => item?.product_id || item?.productId || item?.product?.id)
      .filter(Boolean),
    purchasedItems: asArray(purchasedItems?.items ?? purchasedItems),
    favoriteBrands: asArray(favoriteBrands).map((entry) => entry?.brand || entry?.name || entry).filter(Boolean),
    outfitSuggestions,
  };
}
