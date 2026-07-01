'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';
import {
  closeSupportTicket,
  createSupportTicket,
  fetchSupportNotifications,
  fetchSupportTicket,
  fetchSupportTickets,
  markSupportNotificationsRead,
  reopenSupportTicket,
  replyToSupportTicket,
} from '../services/support.service';

export function useSupportTicketsQuery(params = {}) {
  const token = useUserAccessToken();

  return useQuery({
    queryKey: ['support-tickets', params],
    queryFn: () => fetchSupportTickets(token, params),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useSupportTicketQuery(ticketId) {
  const token = useUserAccessToken();

  return useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: () => fetchSupportTicket(token, ticketId),
    enabled: Boolean(token && ticketId),
    staleTime: QUERY_STALE_TIME.SHORT,
    refetchOnWindowFocus: true,
  });
}

export function useSupportNotificationsQuery(params = {}) {
  const token = useUserAccessToken();

  return useQuery({
    queryKey: ['support-notifications', params],
    queryFn: () => fetchSupportNotifications(token, params),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
    refetchInterval: 30000,
  });
}

export function useCreateSupportTicketMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => createSupportTicket(token, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-notifications'] });
    },
  });
}

export function useReplySupportTicketMutation(ticketId) {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => replyToSupportTicket(token, ticketId, formData),
    onSuccess: (updatedTicket) => {
      if (updatedTicket) {
        queryClient.setQueryData(['support-ticket', ticketId], updatedTicket);
      }
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-notifications'] });
    },
  });
}

export function useCloseSupportTicketMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId) => closeSupportTicket(token, ticketId),
    onSuccess: (_, ticketId) => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}

export function useReopenSupportTicketMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId) => reopenSupportTicket(token, ticketId),
    onSuccess: (_, ticketId) => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}

export function useMarkSupportNotificationsReadMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids) => markSupportNotificationsRead(token, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-notifications'] });
    },
  });
}
