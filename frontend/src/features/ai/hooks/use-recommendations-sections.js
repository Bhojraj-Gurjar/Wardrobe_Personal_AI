'use client';

import { useQueries } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import {
  fetchDailyRecommendations,
  fetchRecommendations,
  fetchSeasonalRecommendations,
  fetchTrendingRecommendations,
} from '@/features/ai/services';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';

export function useRecommendationsSections({ limit = 12 } = {}) {
  const token = useUserAccessToken();

  const results = useQueries({
    queries: [
      {
        queryKey: ['recommendations', { mode: 'daily', limit }],
        queryFn: () => fetchDailyRecommendations({ limit }, token),
        enabled: Boolean(token),
        staleTime: QUERY_STALE_TIME.SHORT,
      },
      {
        queryKey: ['recommendations', { mode: 'seasonal', limit }],
        queryFn: () => fetchSeasonalRecommendations({ limit }, token),
        enabled: Boolean(token),
        staleTime: QUERY_STALE_TIME.SHORT,
      },
      {
        queryKey: ['recommendations', { mode: 'trending', limit }],
        queryFn: () => fetchTrendingRecommendations({ limit }, token),
        enabled: Boolean(token),
        staleTime: QUERY_STALE_TIME.SHORT,
      },
      {
        queryKey: ['recommendations', { mode: 'default', limit: Math.max(limit, 24) }],
        queryFn: () => fetchRecommendations({ limit: Math.max(limit, 24) }, token),
        enabled: Boolean(token),
        staleTime: QUERY_STALE_TIME.SHORT,
      },
    ],
  });

  const [dailyQuery, seasonalQuery, trendingQuery, defaultQuery] = results;

  return {
    daily: dailyQuery.data,
    seasonal: seasonalQuery.data,
    trending: trendingQuery.data,
    default: defaultQuery.data,
    isLoading: results.some((query) => query.isLoading),
    isError: results.some((query) => query.isError),
    error: results.find((query) => query.error)?.error,
    refetch: () => Promise.all(results.map((query) => query.refetch())),
    factors:
      dailyQuery.data?.factors
      || seasonalQuery.data?.factors
      || trendingQuery.data?.factors
      || defaultQuery.data?.factors
      || null,
    emptyState:
      dailyQuery.data?.empty_state
      || seasonalQuery.data?.empty_state
      || trendingQuery.data?.empty_state
      || defaultQuery.data?.empty_state
      || null,
  };
}
