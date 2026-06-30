'use client';

import { useMutation } from '@tanstack/react-query';
import { changePassword } from '@/features/profile/services';
import { useAuthStore } from '@/stores/auth-store';
import { showToast } from '@/stores/toast-store';

export function useChangePasswordMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload) =>
      changePassword(
        {
          currentPassword: payload.current,
          newPassword: payload.next,
          confirmPassword: payload.confirm,
        },
        token,
      ),
    onSuccess: (data) => {
      if (data?.accessToken && data?.refreshToken) {
        setSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user,
        });
      }

      showToast('Password updated successfully.');
    },
  });
}
