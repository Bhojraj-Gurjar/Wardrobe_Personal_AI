'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { ROUTES } from '@/constants/routes';
import { fetchDashboardSummary } from '@/features/dashboard/services/dashboard.service';
import { useProfileQuery } from '@/features/profile/hooks';
import { getProductImageUrl } from '@/features/products/utils/product-catalog.utils';
import { useUserAccessToken } from '@/stores/auth-store';

export const DASHBOARD_SUMMARY_QUERY_KEY = ['dashboard', 'summary'];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function scoreToMatchPercent(score) {
  return Math.min(99, Math.max(70, Math.round(score)));
}

function buildWardrobeTrend(count) {
  if (count > 0) {
    return `${count} item${count === 1 ? '' : 's'} in your closet`;
  }

  return 'Add items to your wardrobe';
}

function buildSavedLooksTrend(count) {
  if (count > 0) {
    return `${count} saved outfit${count === 1 ? '' : 's'}`;
  }

  return 'Save outfits from Digital Avatar';
}

export function useDashboardData() {
  const token = useUserAccessToken();
  const profileQuery = useProfileQuery();

  const dashboardQuery = useQuery({
    queryKey: DASHBOARD_SUMMARY_QUERY_KEY,
    queryFn: () => fetchDashboardSummary(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.DEFAULT,
    retry: false,
  });

  const summary = dashboardQuery.data;
  const profile = profileQuery.data;
  const statsData = summary?.stats;
  const fashionDna = summary?.fashionDna;
  const todaysPicks = summary?.todaysPicks ?? [];

  const greeting = useMemo(() => getGreeting(), []);

  const displayName = useMemo(
    () =>
      profile?.name
      || profile?.email?.split('@')[0]
      || 'Fashion Explorer',
    [profile?.email, profile?.name],
  );

  const hasFashionDna = Boolean(
    fashionDna?.fashionConfidenceScore
    && !fashionDna?.isDefault
    && !fashionDna?.isEmpty,
  );
  const hasRecommendations = todaysPicks.length > 0;

  const styleScore = hasFashionDna
    ? Math.round(fashionDna.fashionConfidenceScore)
    : statsData?.styleScore ?? null;

  const wardrobeCount = Number(statsData?.wardrobeItemsCount ?? 0);
  const savedLooksCount = Number(statsData?.savedLooksCount ?? 0);
  const aiMatchesCount = Number(statsData?.aiMatchesCount ?? 0);

  const isSummaryLoading = dashboardQuery.isLoading && !summary;

  const stats = useMemo(
    () => [
      {
        id: 'wardrobe',
        title: 'Wardrobe Items',
        value: String(wardrobeCount),
        trend: buildWardrobeTrend(wardrobeCount),
        trendTone: 'primary',
        isMock: false,
        isLoading: isSummaryLoading,
        href: ROUTES.MY_CLOSET,
      },
      {
        id: 'style',
        title: 'Style Score',
        value: styleScore !== null ? String(styleScore) : '—',
        trend: hasFashionDna ? 'Based on your Fashion DNA' : 'Generate Fashion DNA',
        trendTone: 'warning',
        isMock: false,
        isLoading: isSummaryLoading,
        href: ROUTES.AI.FASHION_DNA,
      },
      {
        id: 'matches',
        title: 'AI Matches',
        value: String(aiMatchesCount),
        trend: aiMatchesCount > 0 ? 'Personalized for you' : 'Browse products to get matches',
        trendTone: 'info',
        isMock: false,
        isLoading: isSummaryLoading,
        href: ROUTES.AI.RECOMMENDATIONS,
      },
      {
        id: 'saved',
        title: 'Saved Looks',
        value: String(savedLooksCount),
        trend: buildSavedLooksTrend(savedLooksCount),
        trendTone: 'pink',
        isMock: false,
        isLoading: isSummaryLoading,
        href: ROUTES.MY_CLOSET,
      },
    ],
    [
      aiMatchesCount,
      hasFashionDna,
      isSummaryLoading,
      savedLooksCount,
      styleScore,
      wardrobeCount,
    ],
  );

  const picks = useMemo(
    () =>
      hasRecommendations
        ? todaysPicks.map((item) => ({
            id: item.product?.id,
            product: item.product,
            name: item.product?.name || 'Recommended pick',
            image: getProductImageUrl(item.product),
            matchPercent: scoreToMatchPercent(item.score),
            href: item.product?.id
              ? ROUTES.PRODUCTS.DETAIL(item.product.id)
              : ROUTES.AI.RECOMMENDATIONS,
            isMock: false,
          })).filter((pick) => pick.id)
        : [],
    [hasRecommendations, todaysPicks],
  );

  const dna = useMemo(
    () =>
      fashionDna
        ? {
            score: fashionDna.score,
            confidenceLabel: fashionDna.confidenceLabel,
            rankLabel: fashionDna.rankLabel,
            isMock: false,
            isEmpty: Boolean(fashionDna.isEmpty),
          }
        : {
            score: null,
            confidenceLabel: 'Not generated',
            rankLabel: 'Complete onboarding to unlock',
            isMock: false,
            isEmpty: true,
          },
    [fashionDna],
  );

  return {
    greeting,
    displayName,
    stats,
    picks,
    picksLoading: isSummaryLoading,
    picksEmpty: !hasRecommendations,
    dna,
    dnaLoading: isSummaryLoading,
    dnaEmpty: !hasFashionDna,
    profileLoading: profileQuery.isLoading,
    styleScore,
    isLoading: isSummaryLoading,
    error: dashboardQuery.error,
  };
}
