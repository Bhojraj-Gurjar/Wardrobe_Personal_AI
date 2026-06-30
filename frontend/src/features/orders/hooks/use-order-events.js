'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import { useAuthStore } from '@/stores/auth-store';

export function useOrderEvents({ enabled = true } = {}) {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !token || typeof window === 'undefined') {
      return undefined;
    }

    const url = `${API_BASE_URL}${API_ENDPOINTS.ORDERS.EVENTS}?token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['orders'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['order'], refetchType: 'active' });
    };

    source.addEventListener('message', invalidate);

    return () => {
      source.removeEventListener('message', invalidate);
      source.close();
    };
  }, [enabled, queryClient, token]);
}
