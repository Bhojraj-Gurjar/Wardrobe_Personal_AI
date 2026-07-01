'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import {
  fetchDailyRecommendations,
  fetchEventRecommendations,
  fetchRecommendations,
  fetchSeasonalRecommendations,
  fetchTrendingRecommendations,
} from '@/features/ai/services';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';

const FETCHERS = {
  default: fetchRecommendations,
  daily: fetchDailyRecommendations,
  seasonal: fetchSeasonalRecommendations,
  event: fetchEventRecommendations,
  trending: fetchTrendingRecommendations,
};

export function useRecommendationsQuery(params = {}) {
  const token = useUserAccessToken();
  const fetcher = FETCHERS[params.mode] || FETCHERS.default;

  return useQuery({
    queryKey: ['recommendations', params],
    queryFn: () => fetcher(params, token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (error?.status === 400 || error?.status === 401) {
        return false;
      }

      return failureCount < 1;
    },
  });
}
