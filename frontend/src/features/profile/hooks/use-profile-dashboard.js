'use client';

import { useMemo } from 'react';
import { useAvatarQuery } from '@/features/digital-avatar/hooks/use-avatar';
import { useBodyAnalysisQuery } from '@/features/body-analysis/hooks';
import { mergeBodyAnalysisDashboard } from '@/features/body-analysis/utils/merge-body-analysis-dashboard';
import { useFaceAnalysisQuery } from '@/features/face-analysis/hooks';
import { mergeFaceAnalysisDashboard } from '@/features/face-analysis/utils/merge-face-analysis-dashboard';
import { useFashionDnaQuery } from '@/features/fashion-dna/hooks';
import { mergeFashionDna } from '@/features/fashion-dna/utils/merge-fashion-dna';
import { useClosetOverviewQuery, useSavedOutfitsQuery } from '@/features/personal-closet/hooks/use-closet';
import { useOrdersQuery } from '@/features/orders/hooks';
import { useVirtualTryOnResultsQuery } from '@/features/virtual-try-on/hooks/use-virtual-try-on';
import { useWishlistQuery } from '@/features/wishlist/hooks';
import { useProfileQuery } from '@/features/profile/hooks';
import {
  buildFashionIdentity,
  buildFashionJourney,
  buildPersonalizationHealth,
  buildStylePersonalityLabel,
  computeProfileCompletion,
  formatMemberSince,
} from '@/features/profile/utils/profile-dashboard.util';

export function useProfileDashboard() {
  const profileQuery = useProfileQuery();
  const faceQuery = useFaceAnalysisQuery();
  const bodyQuery = useBodyAnalysisQuery();
  const fashionDnaQuery = useFashionDnaQuery();
  const closetQuery = useClosetOverviewQuery();
  const savedOutfitsQuery = useSavedOutfitsQuery();
  const wishlistQuery = useWishlistQuery();
  const ordersQuery = useOrdersQuery({ page: 1, limit: 50 });
  const tryOnQuery = useVirtualTryOnResultsQuery();
  const avatarQuery = useAvatarQuery();

  const profile = profileQuery.data;
  const faceAnalysis = faceQuery.data;
  const bodyAnalysis = bodyQuery.data;
  const fashionDna = useMemo(
    () => mergeFashionDna(fashionDnaQuery.data),
    [fashionDnaQuery.data],
  );
  const faceDashboard = useMemo(
    () => mergeFaceAnalysisDashboard(faceAnalysis),
    [faceAnalysis],
  );
  const bodyDashboard = useMemo(
    () => mergeBodyAnalysisDashboard(bodyAnalysis),
    [bodyAnalysis],
  );

  const completion = useMemo(
    () => computeProfileCompletion({
      profile,
      faceAnalysis,
      bodyAnalysis,
      fashionDna,
      closetOverview: closetQuery.data,
      avatar: avatarQuery.data,
    }),
    [profile, faceAnalysis, bodyAnalysis, fashionDna, closetQuery.data, avatarQuery.data],
  );

  const fashionIdentity = useMemo(
    () => buildFashionIdentity({
      profile,
      faceDashboard,
      bodyDashboard,
      fashionDna,
    }),
    [profile, faceDashboard, bodyDashboard, fashionDna],
  );

  const personalizationHealth = useMemo(
    () => buildPersonalizationHealth({
      faceAnalysis,
      bodyAnalysis,
      fashionDna,
      closetOverview: closetQuery.data,
      profile,
      avatar: avatarQuery.data,
    }),
    [faceAnalysis, bodyAnalysis, fashionDna, closetQuery.data, profile, avatarQuery.data],
  );

  const fashionJourney = useMemo(
    () => buildFashionJourney({
      profile,
      faceAnalysis,
      bodyAnalysis,
      avatar: avatarQuery.data,
      savedOutfits: savedOutfitsQuery.data,
      orders: ordersQuery.data,
      tryOnResults: tryOnQuery.data,
    }),
    [
      profile,
      faceAnalysis,
      bodyAnalysis,
      avatarQuery.data,
      savedOutfitsQuery.data,
      ordersQuery.data,
      tryOnQuery.data,
    ],
  );

  const wardrobeStats = useMemo(() => {
    const overview = closetQuery.data || {};
    const wishlistCount = wishlistQuery.data?.items?.length ?? 0;
    const ordersCount = ordersQuery.data?.meta?.total ?? ordersQuery.data?.items?.length ?? 0;
    const savedLooks = overview.savedOutfits ?? savedOutfitsQuery.data?.length ?? 0;
    const closetItems = overview.purchasedItems ?? 0;
    const tryOnCount = Array.isArray(tryOnQuery.data)
      ? tryOnQuery.data.length
      : tryOnQuery.data?.items?.length ?? 0;

    return {
      closetItems,
      savedLooks,
      wishlistCount,
      ordersCount,
      tryOnCount,
    };
  }, [
    closetQuery.data,
    wishlistQuery.data,
    ordersQuery.data,
    savedOutfitsQuery.data,
    tryOnQuery.data,
  ]);

  const stylePersonality = useMemo(
    () => buildStylePersonalityLabel(fashionDna, profile?.preferences),
    [fashionDna, profile?.preferences],
  );

  const memberSince = formatMemberSince(profile?.created_at);

  const isLoading =
    profileQuery.isLoading
    || faceQuery.isLoading
    || bodyQuery.isLoading
    || fashionDnaQuery.isLoading
    || closetQuery.isLoading;

  return {
    profile,
    faceAnalysis,
    bodyAnalysis,
    faceDashboard,
    bodyDashboard,
    fashionDna,
    completion,
    fashionIdentity,
    personalizationHealth,
    fashionJourney,
    wardrobeStats,
    stylePersonality,
    memberSince,
    isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
  };
}
