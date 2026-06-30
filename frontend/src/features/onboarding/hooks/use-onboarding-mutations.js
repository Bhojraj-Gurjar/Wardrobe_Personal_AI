'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { runBodyAnalysis } from '@/features/body-analysis/utils/run-body-analysis';
import { BODY_ANALYSIS_QUERY_KEY } from '@/features/body-analysis/hooks/use-body-analysis';
import { FACE_ANALYSIS_QUERY_KEY } from '@/features/face-analysis/hooks/use-face-analysis';
import { FASHION_DNA_QUERY_KEY } from '@/features/fashion-dna/hooks/use-fashion-dna';
import { DIGITAL_AVATAR_QUERY_KEY } from '@/features/digital-avatar/hooks/use-digital-avatar';
import { updateProfile } from '@/features/profile/services';
import { toPreferencesPayload } from '@/features/onboarding/schemas/onboarding.schema';
import { useAuthStore } from '@/stores/auth-store';
import { useOnboardingStore } from '@/stores/onboarding-store';

function getToken() {
  return useAuthStore.getState().accessToken;
}

function invalidatePipelineQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: BODY_ANALYSIS_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: FACE_ANALYSIS_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: FASHION_DNA_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: DIGITAL_AVATAR_QUERY_KEY });
}

export function useOnboardingProfileMutation() {
  const queryClient = useQueryClient();
  const setPersonalDetails = useOnboardingStore(
    (state) => state.setPersonalDetails,
  );

  return useMutation({
    mutationFn: (payload) => updateProfile(payload, getToken()),
    onSuccess: (data, variables) => {
      setPersonalDetails(variables);
      if (data) {
        queryClient.setQueryData(['profile'], data);
      }

      const height = variables?.height ?? data?.height;
      runBodyAnalysis({ token: getToken(), queryClient, height })
        .then(() => invalidatePipelineQueries(queryClient))
        .catch(() => {});
    },
  });
}

export function useCompleteOnboardingMutation() {
  const queryClient = useQueryClient();
  const setStyle = useOnboardingStore((state) => state.setStyle);
  const markCompleted = useOnboardingStore((state) => state.markCompleted);

  return useMutation({
    mutationFn: async (style) => {
      const { personalDetails, lifestyle } = useOnboardingStore.getState();

      if (!personalDetails || !lifestyle || !style) {
        throw new Error('Complete all onboarding steps first');
      }

      const profileData = await updateProfile(
        {
          ...personalDetails,
          preferences: toPreferencesPayload(lifestyle, style),
        },
        getToken(),
      );

      return { style, profileData };
    },
    onSuccess: ({ style, profileData }) => {
      setStyle(style);
      markCompleted();

      if (profileData) {
        queryClient.setQueryData(['profile'], profileData);
      }

      const { personalDetails } = useOnboardingStore.getState();
      const height = personalDetails?.height ?? profileData?.height;

      runBodyAnalysis({ token: getToken(), queryClient, height })
        .then(() => {
          invalidatePipelineQueries(queryClient);
        })
        .catch(() => {
          invalidatePipelineQueries(queryClient);
        });
    },
  });
}
