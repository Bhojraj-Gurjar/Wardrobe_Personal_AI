'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import {
  analyzeBodyImage,
  analyzeCurrentBody,
  fetchBodyAnalysis,
  updateBodyAnalysis,
} from '@/features/body-analysis/services';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';

export const BODY_ANALYSIS_QUERY_KEY = ['body-analysis'];

const BODY_ANALYSIS_POLL_MS = 4000;

export function useBodyAnalysisQuery() {
  const token = useUserAccessToken();

  return useQuery({
    queryKey: BODY_ANALYSIS_QUERY_KEY,
    queryFn: async () => {
      try {
        return await fetchBodyAnalysis(token);
      } catch {
        return null;
      }
    },
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.LONG,
    retry: false,
    refetchInterval: (query) => {
      const data = query.state.data;

      const hasPhoto = Boolean(
        data?.bodyImageUrl
        || data?.bodyPhotoUrl,
      ) && !data?.bodyPhotoMissing;
      const needsAnalysis = hasPhoto && !data?.hasAnalysis;

      return needsAnalysis ? BODY_ANALYSIS_POLL_MS : false;
    },
  });
}

export function useAnalyzeBodyMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageFile, videoFile, height }) =>
      analyzeBodyImage(token, { imageFile, videoFile, height }),
    onSuccess: (data) => {
      queryClient.setQueryData(BODY_ANALYSIS_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: BODY_ANALYSIS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['fashion-dna'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['virtual-try-on'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: BODY_ANALYSIS_QUERY_KEY });
    },
  });
}

export function useAnalyzeCurrentBodyMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => analyzeCurrentBody(token),
    onSuccess: (data) => {
      queryClient.setQueryData(BODY_ANALYSIS_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: BODY_ANALYSIS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['fashion-dna'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['virtual-try-on'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: BODY_ANALYSIS_QUERY_KEY });
    },
  });
}

export function useUpdateBodyAnalysisMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateBodyAnalysis(payload, token),
    onSuccess: (data) => {
      queryClient.setQueryData(BODY_ANALYSIS_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: ['fashion-dna'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['virtual-try-on'] });
    },
  });
}
