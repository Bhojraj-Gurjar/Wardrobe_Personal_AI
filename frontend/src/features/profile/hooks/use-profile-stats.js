'use client';

import { useMemo } from 'react';
import { useClosetOverviewQuery } from '@/features/personal-closet/hooks/use-closet';
import { useWishlistQuery } from '@/features/wishlist/hooks';
import { useOrdersQuery } from '@/features/orders/hooks';
import { useFashionDnaQuery } from '@/features/fashion-dna/hooks';
import { mergeFashionDna } from '@/features/fashion-dna/utils/merge-fashion-dna';

export function useProfileStats() {
  const { data: closetOverview } = useClosetOverviewQuery();
  const { data: wishlist } = useWishlistQuery();
  const { data: orders } = useOrdersQuery({ page: 1, limit: 1 });
  const { data: fashionDnaRaw } = useFashionDnaQuery();

  const fashionDna = useMemo(
    () => mergeFashionDna(fashionDnaRaw),
    [fashionDnaRaw],
  );

  const wishlistCount = wishlist?.items?.length ?? 0;
  const ordersCount = orders?.meta?.total ?? orders?.items?.length ?? 0;
  const wardrobeItems = closetOverview?.purchasedItems ?? 0;
  const styleScore = fashionDna.confidenceScore || null;

  return {
    wardrobeItems,
    wishlistCount,
    ordersCount,
    styleScore,
    isLoading: false,
  };
}
