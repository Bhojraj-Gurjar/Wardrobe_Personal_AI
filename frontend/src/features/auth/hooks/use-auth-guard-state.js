'use client';

import { useAuthHydrated } from '@/features/auth/hooks/use-auth-hydrated';
import { useSession } from '@/features/auth/components/session-provider';
import { useAuthStore } from '@/stores/auth-store';
import { isAdminUser } from '@/features/admin/utils/is-admin-user';

export function useAuthGuardState() {
  const hydrated = useAuthHydrated();
  const { status, isVerified, isAuthenticated: sessionAuthenticated } = useSession();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  const hasStoredCredentials = Boolean(accessToken);
  const awaitingVerification = hasStoredCredentials && !isVerified;
  const isSessionLoading = status === 'loading' || awaitingVerification;
  const isAwaitingProfile = isVerified && sessionAuthenticated && hasStoredCredentials && !user;

  const isInitializing = !hydrated || isSessionLoading || isAwaitingProfile;
  const isAuthenticated = isVerified && sessionAuthenticated && hasStoredCredentials && Boolean(user);
  const isUnauthenticated = hydrated && isVerified && (status === 'unauthenticated' || !hasStoredCredentials);

  return {
    hydrated,
    status,
    isVerified,
    accessToken,
    user,
    isInitializing,
    isAuthenticated,
    isUnauthenticated,
    isAdmin: isAdminUser(user),
  };
}
