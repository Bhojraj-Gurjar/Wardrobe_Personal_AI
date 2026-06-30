'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { scheduleFashionDnaInvalidation } from '@/features/fashion-dna/utils/schedule-fashion-dna-invalidation';
import {
  createStylistSession,
  deleteStylistSession,
  fetchStylistSession,
  fetchStylistSessions,
  fetchStylistSuggestions,
  sendStylistMessage,
} from '@/features/stylist-chat/services';
import { useAuthStore } from '@/stores/auth-store';

export function useStylistSuggestionsQuery() {
  const token = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['stylist-suggestions'],
    queryFn: () => fetchStylistSuggestions(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.LONG,
  });
}

export function useStylistSessionsQuery() {
  const token = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['stylist-sessions'],
    queryFn: () => fetchStylistSessions(token),
    enabled: Boolean(token),
  });
}

export function useStylistSessionQuery(sessionId) {
  const token = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['stylist-session', sessionId],
    queryFn: () => fetchStylistSession(sessionId, token),
    enabled: Boolean(token && sessionId),
  });
}

export function useStylistChatMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => sendStylistMessage(payload, token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stylist-sessions'] });
      if (data?.session?.id) {
        queryClient.setQueryData(['stylist-session', data.session.id], data.session);
      }
      scheduleFashionDnaInvalidation();
    },
  });
}

export function useCreateStylistSessionMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title) => createStylistSession(token, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stylist-sessions'] });
    },
  });
}

export function useDeleteStylistSessionMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteStylistSession(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stylist-sessions'] });
    },
  });
}
