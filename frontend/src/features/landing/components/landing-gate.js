'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { AUTH_CONTEXT } from '@/features/auth/constants/auth-context';
import { LandingView } from '@/features/landing/components/landing-view';
import { useAuthGuardState } from '@/features/auth/hooks/use-auth-guard-state';
import { LoadingState } from '@/components/shared/loading-state';

export function LandingGate() {
  const router = useRouter();
  const userAuth = useAuthGuardState(AUTH_CONTEXT.USER);
  const adminAuth = useAuthGuardState(AUTH_CONTEXT.ADMIN);

  const isInitializing = userAuth.isInitializing || adminAuth.isInitializing;
  const hasUserSession = userAuth.isAuthenticated;
  const hasAdminSession = adminAuth.isAuthenticated;
  const hasBothSessions = hasUserSession && hasAdminSession;

  useEffect(() => {
    if (isInitializing || hasBothSessions) {
      return;
    }

    if (hasUserSession) {
      router.replace(ROUTES.DASHBOARD.HOME);
      return;
    }

    if (hasAdminSession) {
      router.replace(ROUTES.ADMIN.DASHBOARD);
    }
  }, [hasAdminSession, hasBothSessions, hasUserSession, isInitializing, router]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#06040f]">
        <LoadingState title="Loading…" rows={1} />
      </div>
    );
  }

  if ((hasUserSession || hasAdminSession) && !hasBothSessions) {
    return (
      <div className="min-h-screen bg-[#06040f]">
        <LoadingState title="Redirecting…" rows={1} />
      </div>
    );
  }

  return <LandingView />;
}
