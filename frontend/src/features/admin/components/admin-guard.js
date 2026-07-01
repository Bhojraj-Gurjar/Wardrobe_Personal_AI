'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AUTH_CONTEXT } from '@/features/auth/constants/auth-context';
import { useAuthGuardState } from '@/features/auth/hooks/use-auth-guard-state';
import { buildLoginRedirect } from '@/features/auth/utils/auth-routing';
import { invalidateAuthSession } from '@/features/auth/utils/invalidate-auth-session';
import { LoadingState } from '@/components/shared/loading-state';

export function AdminGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isInitializing,
    isAuthenticated,
    isUnauthenticated,
    isAdmin,
    isVerified,
  } = useAuthGuardState(AUTH_CONTEXT.ADMIN);

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (isUnauthenticated) {
      router.replace(buildLoginRedirect(pathname, window.location.search, { loginType: 'admin' }));
      return;
    }

    if (isVerified && isAuthenticated && !isAdmin) {
      invalidateAuthSession({
        context: AUTH_CONTEXT.ADMIN,
        redirect: true,
        preserveReturnPath: true,
        reason: 'forbidden',
      });
    }
  }, [isAdmin, isAuthenticated, isInitializing, isUnauthenticated, isVerified, pathname, router]);

  if (isInitializing) {
    return <LoadingState title="Checking your session…" rows={1} />;
  }

  if (isUnauthenticated) {
    return <LoadingState title="Redirecting to sign in…" rows={1} />;
  }

  if (!isAdmin) {
    return <LoadingState title="Verifying admin access…" rows={1} />;
  }

  return children;
}
