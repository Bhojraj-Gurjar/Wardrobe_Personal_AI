'use client';

import { useAuthHydrated } from '@/features/auth/hooks/use-auth-hydrated';
import { AUTH_CONTEXT } from '@/features/auth/constants/auth-context';
import { useSession } from '@/features/auth/components/session-provider';
import {
  useAdminAccessToken,
  useAdminProfile,
  useUserAccessToken,
  useUserProfile,
} from '@/stores/auth-store';
import { isAdminUser } from '@/features/admin/utils/is-admin-user';

export function useAuthGuardState(context = AUTH_CONTEXT.USER) {
  const hydrated = useAuthHydrated();
  const userSession = useSession(AUTH_CONTEXT.USER);
  const adminSession = useSession(AUTH_CONTEXT.ADMIN);
  const userAccessToken = useUserAccessToken();
  const adminAccessToken = useAdminAccessToken();
  const userProfile = useUserProfile();
  const adminProfile = useAdminProfile();

  const isAdminContext = context === AUTH_CONTEXT.ADMIN;
  const { status, isVerified, isAuthenticated: sessionAuthenticated } = isAdminContext
    ? adminSession
    : userSession;
  const accessToken = isAdminContext ? adminAccessToken : userAccessToken;
  const user = isAdminContext ? adminProfile : userProfile;

  const hasStoredCredentials = Boolean(accessToken);
  const awaitingVerification = hasStoredCredentials && !isVerified;
  const isSessionLoading = status === 'loading' || awaitingVerification;
  const isAwaitingProfile = isVerified && sessionAuthenticated && hasStoredCredentials && !user;

  const isInitializing = !hydrated || isSessionLoading || isAwaitingProfile;
  const isAuthenticated = isVerified && sessionAuthenticated && hasStoredCredentials && Boolean(user);
  const isUnauthenticated = hydrated && isVerified && (status === 'unauthenticated' || !hasStoredCredentials);

  return {
    context,
    hydrated,
    status,
    isVerified,
    accessToken,
    user,
    isInitializing,
    isAuthenticated,
    isUnauthenticated,
    isAdmin: context === AUTH_CONTEXT.ADMIN && isAdminUser(user),
  };
}
