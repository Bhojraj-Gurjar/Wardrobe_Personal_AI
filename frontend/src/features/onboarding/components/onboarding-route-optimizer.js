'use client';

import { ROUTES } from '@/constants/routes';
import {
  usePrefetchDashboardQueries,
  usePrefetchRoutes,
} from '@/hooks/use-prefetch-app-data';

const ONBOARDING_ROUTES = [
  ROUTES.ONBOARDING.PROFILE,
  ROUTES.ONBOARDING.LIFESTYLE,
  ROUTES.ONBOARDING.STYLE,
  ROUTES.DASHBOARD.HOME,
];

export function OnboardingRouteOptimizer({
  children,
  prefetchDashboard = false,
}) {
  usePrefetchRoutes(ONBOARDING_ROUTES);
  usePrefetchDashboardQueries(prefetchDashboard);

  return children;
}
