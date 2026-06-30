'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { fetchFashionDna } from '@/features/fashion-dna/services';
import { fetchRecommendations } from '@/features/ai/services';
import { fetchProfile, ensureUserArtifacts } from '@/features/profile/services';
import { fetchFaceAnalysis } from '@/features/face-analysis/services';
import { fetchBodyAnalysis } from '@/features/body-analysis/services';
import { fetchDigitalAvatar } from '@/features/digital-avatar/services';
import { useAuthStore } from '@/stores/auth-store';

export function usePrefetchRoutes(routes = []) {
  const router = useRouter();

  useEffect(() => {
    routes.forEach((route) => {
      router.prefetch(route);
    });
  }, [router, routes]);
}

export function usePrefetchDashboardQueries(enabled = true) {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!enabled || !token) return;

    queryClient.prefetchQuery({
      queryKey: ['profile'],
      queryFn: () => fetchProfile(token),
      staleTime: QUERY_STALE_TIME.DEFAULT,
    });

    ensureUserArtifacts(token)
      .then((artifacts) => {
        if (artifacts?.face) {
          queryClient.setQueryData(['face-analysis'], artifacts.face);
        }
        if (artifacts?.body) {
          queryClient.setQueryData(['body-analysis'], artifacts.body);
        }
        if (artifacts?.avatar) {
          queryClient.setQueryData(['digital-avatar'], artifacts.avatar);
        }
        if (artifacts?.fashionDna) {
          queryClient.setQueryData(['fashion-dna'], artifacts.fashionDna);
        }
      })
      .catch(() => null);

    queryClient.prefetchQuery({
      queryKey: ['face-analysis'],
      queryFn: () => fetchFaceAnalysis(token),
      staleTime: QUERY_STALE_TIME.LONG,
    });

    queryClient.prefetchQuery({
      queryKey: ['body-analysis'],
      queryFn: () => fetchBodyAnalysis(token),
      staleTime: QUERY_STALE_TIME.LONG,
    });

    queryClient.prefetchQuery({
      queryKey: ['digital-avatar'],
      queryFn: () => fetchDigitalAvatar(token),
      staleTime: QUERY_STALE_TIME.LONG,
    });

    queryClient.prefetchQuery({
      queryKey: ['fashion-dna'],
      queryFn: () => fetchFashionDna(token),
      staleTime: QUERY_STALE_TIME.LONG,
    });

    queryClient.prefetchQuery({
      queryKey: ['recommendations', { limit: 4 }],
      queryFn: () => fetchRecommendations({ limit: 4 }, token),
      staleTime: QUERY_STALE_TIME.SHORT,
    });
  }, [enabled, queryClient, token]);
}
