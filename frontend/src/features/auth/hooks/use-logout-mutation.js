'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AUTH_CONTEXT } from '@/features/auth/constants/auth-context';
import { logoutRequest } from '@/features/auth/services';
import { clearAuthSession } from '@/features/auth/utils/clear-auth-session';
import {
  useAdminAccessToken,
  useAdminRefreshToken,
  useUserAccessToken,
  useUserRefreshToken,
} from '@/stores/auth-store';
import { ROUTES } from '@/constants/routes';

export function useLogoutMutation(context = AUTH_CONTEXT.USER) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userAccessToken = useUserAccessToken();
  const userRefreshToken = useUserRefreshToken();
  const adminAccessToken = useAdminAccessToken();
  const adminRefreshToken = useAdminRefreshToken();

  const accessToken = context === AUTH_CONTEXT.ADMIN ? adminAccessToken : userAccessToken;
  const refreshToken = context === AUTH_CONTEXT.ADMIN ? adminRefreshToken : userRefreshToken;

  return useMutation({
    mutationFn: async ({ logoutNonce } = {}) => {
      if (refreshToken) {
        await logoutRequest(refreshToken, accessToken, logoutNonce).catch(() => null);
      }
    },
    onSettled: () => {
      clearAuthSession(context);
      queryClient.clear();
      router.replace(
        context === AUTH_CONTEXT.ADMIN
          ? `${ROUTES.AUTH.LOGIN}?loginType=admin`
          : ROUTES.AUTH.LOGIN,
      );
    },
  });
}
