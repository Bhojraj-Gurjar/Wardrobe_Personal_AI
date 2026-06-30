'use client';

import { useMemo } from 'react';
import { useRecommendationsSections } from '@/features/ai/hooks/use-recommendations-sections';
import { useFashionDnaQuery } from '@/features/fashion-dna/hooks';
import { useFaceAnalysisQuery } from '@/features/face-analysis/hooks';
import { useBodyAnalysisQuery } from '@/features/body-analysis/hooks';
import { useProductsQuery } from '@/features/products/hooks';
import { useWishlistQuery } from '@/features/wishlist/hooks';
import {
  useFavoriteBrandsQuery,
  usePurchasedItemsQuery,
} from '@/features/personal-closet/hooks/use-closet';
import { buildDashboardFeedContext } from '@/features/dashboard/utils/dashboard-product-sections.util';

export function useDashboardProductFeedData({ enabled = true } = {}) {
  const {
    daily,
    trending,
    seasonal,
    default: defaultRecommendations,
    isLoading: recommendationsLoading,
    factors,
  } = useRecommendationsSections({ limit: 16 });

  const { data: products, isLoading: productsLoading } = useProductsQuery({
    page: 1,
    limit: 100,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const { data: fashionDna, isLoading: fashionDnaLoading } = useFashionDnaQuery();
  const { data: faceAnalysis } = useFaceAnalysisQuery();
  const { data: bodyAnalysis } = useBodyAnalysisQuery();
  const { data: wishlistData, isLoading: wishlistLoading } = useWishlistQuery();
  const { data: purchasedItems, isLoading: purchasedLoading } = usePurchasedItemsQuery({ limit: 40 });
  const { data: favoriteBrands, isLoading: brandsLoading } = useFavoriteBrandsQuery();

  const feedContext = useMemo(() => {
    if (!enabled) {
      return null;
    }

    return buildDashboardFeedContext({
      recommendations: defaultRecommendations || daily,
      trending,
      seasonal,
      products,
      wishlistItems: wishlistData?.items,
      purchasedItems,
      favoriteBrands,
      fashionDna,
      faceAnalysis,
      bodyAnalysis,
    });
  }, [
    bodyAnalysis,
    daily,
    defaultRecommendations,
    enabled,
    faceAnalysis,
    favoriteBrands,
    fashionDna,
    products,
    purchasedItems,
    seasonal,
    trending,
    wishlistData?.items,
  ]);

  return {
    feedContext,
    fashionDna,
    factors,
    isLoading: enabled && (
      recommendationsLoading
      || productsLoading
      || fashionDnaLoading
      || wishlistLoading
      || purchasedLoading
      || brandsLoading
    ),
  };
}
