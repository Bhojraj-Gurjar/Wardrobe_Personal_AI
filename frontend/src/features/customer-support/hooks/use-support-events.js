'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import { useAuthStore } from '@/stores/auth-store';

export function useSupportEvents({ enabled = true, isAdmin = false } = {}) {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const abortRef = useRef(null);

  useEffect(() => {
    if (!enabled || !token) {
      return undefined;
    }

    const endpoint = isAdmin
      ? API_ENDPOINTS.ADMIN.SUPPORT_EVENTS
      : API_ENDPOINTS.SUPPORT.EVENTS;

    const controller = new AbortController();
    abortRef.current = controller;
    let cancelled = false;

    async function connect() {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          parts.forEach((part) => {
            const dataLine = part.split('\n').find((line) => line.startsWith('data:'));

            if (!dataLine) {
              return;
            }

            try {
              const payload = JSON.parse(dataLine.replace(/^data:\s*/, ''));
              handleEvent(payload, queryClient, isAdmin);
            } catch {
              // ignore malformed events
            }
          });
        }
      } catch (error) {
        if (!cancelled && error?.name !== 'AbortError') {
          setTimeout(connect, 5000);
        }
      }
    }

    connect();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, token, isAdmin, queryClient]);
}

function handleEvent(payload, queryClient, isAdmin) {
  const event = payload?.event;
  const data = payload?.data;

  if (!event) {
    return;
  }

  if (event.includes('ticket')) {
    queryClient.invalidateQueries({
      queryKey: isAdmin ? ['admin-support-tickets'] : ['support-tickets'],
      refetchType: 'active',
    });

    if (data?.ticketId) {
      queryClient.invalidateQueries({
        queryKey: isAdmin
          ? ['admin-support-ticket', data.ticketId]
          : ['support-ticket', data.ticketId],
        refetchType: 'active',
      });
    }
  }

  if (event.includes('message') || event.includes('notification')) {
    queryClient.invalidateQueries({ queryKey: ['support-notifications'], refetchType: 'active' });
    queryClient.invalidateQueries({ queryKey: ['admin-support-notifications'], refetchType: 'active' });
    queryClient.invalidateQueries({ queryKey: ['notifications'], refetchType: 'active' });
    queryClient.invalidateQueries({
      queryKey: isAdmin ? ['admin-support-tickets'] : ['support-tickets'],
      refetchType: 'active',
    });

    if (data?.ticketId) {
      queryClient.invalidateQueries({
        queryKey: isAdmin
          ? ['admin-support-ticket', data.ticketId]
          : ['support-ticket', data.ticketId],
        refetchType: 'active',
      });
    }
  }

  if (isAdmin && event.includes('ticket.created')) {
    queryClient.invalidateQueries({ queryKey: ['admin-support-analytics'] });
  }
}
