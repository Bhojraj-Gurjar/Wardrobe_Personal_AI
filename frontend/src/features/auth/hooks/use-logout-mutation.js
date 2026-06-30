'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { logoutRequest } from '@/features/auth/services';
import { clearAuthSession } from '@/features/auth/utils/clear-auth-session';
import { useAuthStore } from '@/stores/auth-store';
import { ROUTES } from '@/constants/routes';

export function useLogoutMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  return useMutation({
    mutationFn: async ({ logoutNonce } = {}) => {
      if (refreshToken) {
        await logoutRequest(refreshToken, accessToken, logoutNonce).catch(() => null);
      }
    },
    onSettled: () => {
      clearAuthSession();
      queryClient.clear();
      router.replace(ROUTES.AUTH.LOGIN);
    },
  });
}
