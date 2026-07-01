'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import {
  fetchFashionDna,
  fetchFashionDnaHistory,
  generateFashionDna,
  updateFashionDna,
} from '@/features/fashion-dna/services';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';

export const FASHION_DNA_QUERY_KEY = ['fashion-dna'];
export const FASHION_DNA_HISTORY_QUERY_KEY = ['fashion-dna', 'history'];

export function useFashionDnaQuery() {
  const token = useUserAccessToken();

  return useQuery({
    queryKey: FASHION_DNA_QUERY_KEY,
    queryFn: () => fetchFashionDna(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.LONG,
    retry: false,
  });
}

export function useFashionDnaHistoryQuery(params = {}) {
  const token = useUserAccessToken();

  return useQuery({
    queryKey: [...FASHION_DNA_HISTORY_QUERY_KEY, params],
    queryFn: () => fetchFashionDnaHistory(token, params),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
    retry: false,
  });
}

export function useGenerateFashionDnaMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generateFashionDna(token),
    onSuccess: (data) => {
      queryClient.setQueryData(FASHION_DNA_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: FASHION_DNA_HISTORY_QUERY_KEY });
    },
  });
}

export function useUpdateFashionDnaMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateFashionDna(payload, token),
    onSuccess: (data) => {
      queryClient.setQueryData(FASHION_DNA_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: FASHION_DNA_HISTORY_QUERY_KEY });
    },
  });
}
