'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { registerFaceImage } from '@/features/face/services/faceService';
import { useAuthStore } from '@/stores/auth-store';

export function useFaceRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => {
      const token = useAuthStore.getState().accessToken;

      if (payload?.frames?.length) {
        return registerFaceImage(null, token, payload);
      }

      return registerFaceImage(payload, token);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], (current) => {
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
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['face-analysis'] });
    },
  });
}
