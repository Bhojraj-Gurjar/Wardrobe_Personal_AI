'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { LandingView } from '@/features/landing/components/landing-view';
import { useAuthGuardState } from '@/features/auth/hooks/use-auth-guard-state';
import { LoadingState } from '@/components/shared/loading-state';

export function LandingGate() {
  const router = useRouter();
  const {
    isInitializing,
    isAuthenticated,
    isAdmin,
  } = useAuthGuardState();

  useEffect(() => {
    if (isInitializing || !isAuthenticated) {
      return;
    }

    router.replace(
      isAdmin ? ROUTES.ADMIN.DASHBOARD : ROUTES.DASHBOARD.HOME,
    );
  }, [isAdmin, isAuthenticated, isInitializing, router]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#06040f]">
        <LoadingState title="Loading…" rows={1} />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#06040f]">
        <LoadingState title="Redirecting…" rows={1} />
      </div>
    );
  }

  return <LandingView />;
}
