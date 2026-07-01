'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateFacePhoto } from '@/features/face/services/faceService';
import { FACE_ANALYSIS_QUERY_KEY } from '@/features/face-analysis/hooks/use-face-analysis';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';

const PROFILE_QUERY_KEY = ['profile'];

export function useUpdateFacePhotoMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => {
      if (payload?.frames?.length) {
        return updateFacePhoto(null, token, payload);
      }

      return updateFacePhoto(payload, token);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          faceImageUrl: data.faceImageUrl,
          face_image_url: data.face_image_url,
          is_face_registered: data.is_face_registered,
        };
      });

      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FACE_ANALYSIS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['user-media'] });
    },
  });
}
