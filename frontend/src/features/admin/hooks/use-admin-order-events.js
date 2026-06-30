'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';

function invalidateOrderQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
  queryClient.invalidateQueries({ queryKey: ['admin-oms-summary'] });
  queryClient.invalidateQueries({ queryKey: ['admin-orders-summary'] });
}

export function useAdminOrderEvents({ enabled = false, token }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !token || typeof window === 'undefined') {
      return undefined;
    }

    const controller = new AbortController();
    let reconnectTimer;

    async function connect() {
      let buffer = '';

      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN.OMS_EVENTS}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          reconnectTimer = window.setTimeout(connect, 8000);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (!controller.signal.aborted) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() || '';

          for (const chunk of chunks) {
            if (chunk.includes('data:')) {
              invalidateOrderQueries(queryClient);
            }
          }
        }
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }
      }

      if (!controller.signal.aborted) {
        reconnectTimer = window.setTimeout(connect, 8000);
      }
    }

    connect();

    return () => {
      controller.abort();
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
    };
  }, [enabled, token, queryClient]);
}
