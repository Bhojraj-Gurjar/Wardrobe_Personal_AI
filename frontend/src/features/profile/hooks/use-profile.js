'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { runBodyAnalysis } from '@/features/body-analysis/utils/run-body-analysis';
import { fetchProfile, updateProfile } from '@/features/profile/services';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';

const PROFILE_BODY_FIELDS = ['height', 'weight', 'body_type'];

function hasBodyProfileChanges(payload) {
  return PROFILE_BODY_FIELDS.some((field) => payload[field] !== undefined);
}

export function useProfileQuery() {
  const token = useUserAccessToken();

  return useQuery({
    queryKey: ['profile'],
    queryFn: () => fetchProfile(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.DEFAULT,
  });
}

export function useUpdateProfileMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateProfile(payload, token),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['profile'], data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['fashion-dna'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['face-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['body-analysis'] });

      if (!hasBodyProfileChanges(variables)) {
        return;
      }

      const height = variables.height ?? data?.height;
      runBodyAnalysis({ token, queryClient, height }).catch(() => {});
    },
  });
}
