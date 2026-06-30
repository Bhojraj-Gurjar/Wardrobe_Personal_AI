'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthGuardState } from '@/features/auth/hooks/use-auth-guard-state';
import { buildLoginRedirect } from '@/features/auth/utils/auth-routing';
import { LoadingState } from '@/components/shared/loading-state';

export function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isInitializing,
    isAuthenticated,
    isUnauthenticated,
  } = useAuthGuardState();

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (isUnauthenticated) {
      const redirect = buildLoginRedirect(pathname, window.location.search);
      router.replace(redirect);
    }
  }, [isAuthenticated, isInitializing, isUnauthenticated, pathname, router]);

  if (isInitializing) {
    return <LoadingState title="Checking your session…" rows={1} />;
  }

  if (isUnauthenticated) {
    return <LoadingState title="Redirecting to sign in…" rows={1} />;
  }

  return children;
}
