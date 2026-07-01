'use client';

import { useMutation } from '@tanstack/react-query';
import { changePassword } from '@/features/profile/services';
import { AUTH_CONTEXT } from '@/features/auth/constants/auth-context';
import { useSetUserSession, useUserAccessToken, useUserProfile } from '@/stores/auth-store';
import { syncSessionCookies } from '@/features/auth/utils/session-cookie';
import { showToast } from '@/stores/toast-store';

export function useChangePasswordMutation() {
  const token = useUserAccessToken();
  const user = useUserProfile();
  const setUserSession = useSetUserSession();

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
        setUserSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user,
        });
        syncSessionCookies(AUTH_CONTEXT.USER, user);
      }

      showToast('Password updated successfully.');
    },
  });
}
