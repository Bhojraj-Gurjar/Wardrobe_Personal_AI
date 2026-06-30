'use client';

import { useMutation } from '@tanstack/react-query';
import {
  loginWithFaceImage,
  verifyFaceImage,
  verifyFaceForLogout,
} from '@/features/face/services/faceService';
import { establishSession } from '@/features/auth/utils/establish-session';
import { useAuthStore } from '@/stores/auth-store';

export function useFaceLoginMutation(options = {}) {
  return useMutation({
    mutationFn: (imageFile) => loginWithFaceImage(imageFile),
    onSuccess: (data) => {
      establishSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      options.onSuccess?.(data);
    },
  });
}

export function useFaceVerifyMutation() {
  const token = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: (imageFile) => verifyFaceImage(imageFile, token),
  });
}

export function useFaceLogoutVerifyMutation() {
  const token = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: (imageFile) => verifyFaceForLogout(imageFile, token),
  });
}
