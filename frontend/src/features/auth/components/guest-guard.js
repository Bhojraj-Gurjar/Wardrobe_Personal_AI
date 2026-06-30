'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { useAuthGuardState } from '@/features/auth/hooks/use-auth-guard-state';
import { resolveAuthenticatedLanding } from '@/features/auth/utils/auth-routing';
import { LoadingState } from '@/components/shared/loading-state';

function GuestGuardContent({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    user,
    isInitializing,
    isAuthenticated,
    isVerified,
  } = useAuthGuardState();
  const isRegisterPage = pathname === ROUTES.AUTH.REGISTER;

  useEffect(() => {
    if (isInitializing || !isVerified || !isAuthenticated) {
      return;
    }

    if (isRegisterPage) {
      router.replace(ROUTES.FACE.REGISTER);
      return;
    }

    const redirect = searchParams.get('redirect');
    router.replace(
      resolveAuthenticatedLanding(user, { redirect, pathname }),
    );
  }, [isAuthenticated, isInitializing, isRegisterPage, isVerified, pathname, router, searchParams, user]);

  if (isInitializing) {
    return <LoadingState title="Loading…" rows={1} />;
  }

  if (isAuthenticated) {
    return (
      <LoadingState
        title={
          isRegisterPage
            ? 'Continuing to face registration…'
            : 'Redirecting…'
        }
        rows={1}
      />
    );
  }

  return children;
}

export function GuestGuard({ children }) {
  return (
    <Suspense fallback={<LoadingState title="Loading…" rows={1} />}>
      <GuestGuardContent>{children}</GuestGuardContent>
    </Suspense>
  );
}
