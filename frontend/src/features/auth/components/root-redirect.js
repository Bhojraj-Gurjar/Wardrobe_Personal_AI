'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { useAuthGuardState } from '@/features/auth/hooks/use-auth-guard-state';
import { LoadingState } from '@/components/shared/loading-state';

export function RootRedirect() {
  const router = useRouter();
  const {
    user,
    isInitializing,
    isAuthenticated,
  } = useAuthGuardState();

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (isAuthenticated) {
      router.replace(
        user?.role === 'ADMIN' ? ROUTES.ADMIN.DASHBOARD : ROUTES.DASHBOARD.HOME,
      );
      return;
    }

    router.replace(ROUTES.HOME);
  }, [isAuthenticated, isInitializing, router, user?.role]);

  return <LoadingState title="Loading…" rows={1} />;
}
