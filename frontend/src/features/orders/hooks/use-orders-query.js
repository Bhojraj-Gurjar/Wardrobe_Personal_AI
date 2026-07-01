'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { fetchOrders } from '@/features/orders/services';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';

export function useOrdersQuery(params = {}) {
  const token = useUserAccessToken();

  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => fetchOrders(token, params),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.DEFAULT,
  });
}
