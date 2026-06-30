'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { useSession } from '@/features/auth/components/session-provider';
import { isAdminUser } from '@/features/admin/utils/is-admin-user';
import { useAuthStore } from '@/stores/auth-store';
import {
  deleteAdminSupportTicket,
  exportAdminSupportTickets,
  fetchAdminSupportAnalytics,
  fetchAdminSupportAssignees,
  fetchAdminSupportTicket,
  fetchAdminSupportTickets,
  replyAdminSupportTicket,
  updateAdminSupportTicket,
} from '../services/support.service';

function useAdminToken() {
  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const { isAuthenticated } = useSession();

  return {
    token,
    enabled: Boolean(token && isAuthenticated && isAdminUser(user)),
  };
}

export function useAdminSupportTicketsQuery(params = {}) {
  const { token, enabled } = useAdminToken();

  return useQuery({
    queryKey: ['admin-support-tickets', params],
    queryFn: () => fetchAdminSupportTickets(token, params),
    enabled,
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminSupportTicketQuery(ticketId) {
  const { token, enabled } = useAdminToken();

  return useQuery({
    queryKey: ['admin-support-ticket', ticketId],
    queryFn: () => fetchAdminSupportTicket(token, ticketId),
    enabled: enabled && Boolean(ticketId),
    staleTime: QUERY_STALE_TIME.SHORT,
    refetchOnWindowFocus: true,
  });
}

export function useAdminSupportAnalyticsQuery() {
  const { token, enabled } = useAdminToken();

  return useQuery({
    queryKey: ['admin-support-analytics'],
    queryFn: () => fetchAdminSupportAnalytics(token),
    enabled,
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useAdminSupportAssigneesQuery() {
  const { token, enabled } = useAdminToken();

  return useQuery({
    queryKey: ['admin-support-assignees'],
    queryFn: () => fetchAdminSupportAssignees(token),
    enabled,
    staleTime: QUERY_STALE_TIME.LONG,
  });
}

export function useAdminUpdateSupportTicketMutation() {
  const { token } = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, body }) => updateAdminSupportTicket(token, ticketId, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-analytics'] });
    },
  });
}

export function useAdminReplySupportTicketMutation(ticketId) {
  const { token } = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => replyAdminSupportTicket(token, ticketId, formData),
    onSuccess: (updatedTicket) => {
      if (updatedTicket) {
        queryClient.setQueryData(['admin-support-ticket', ticketId], updatedTicket);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    },
  });
}

export function useAdminDeleteSupportTicketMutation() {
  const { token } = useAdminToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId) => deleteAdminSupportTicket(token, ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-analytics'] });
    },
  });
}

export function useAdminExportSupportTicketsMutation() {
  const { token } = useAdminToken();

  return useMutation({
    mutationFn: (params) => exportAdminSupportTickets(token, params),
  });
}

export function useAdminSupportFiltersFromUrl() {
  const searchParams = useSearchParams();

  return useMemo(() => ({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    category: searchParams.get('category') || '',
    priority: searchParams.get('priority') || '',
    ticket: searchParams.get('ticket') || '',
    page: 1,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc',
  }), [searchParams]);
}
