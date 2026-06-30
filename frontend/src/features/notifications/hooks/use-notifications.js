'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { useAuthStore } from '@/stores/auth-store';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationsRead,
} from '../services/notifications.service';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'];
export const UNREAD_COUNT_QUERY_KEY = ['notifications', 'unread-count'];

export function useNotificationsQuery({ category = 'ALL', search = '', isAdmin = false } = {}) {
  const token = useAuthStore((state) => state.accessToken);

  return useInfiniteQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, isAdmin, category, search],
    queryFn: ({ pageParam = 1 }) => fetchNotifications(
      token,
      { page: pageParam, limit: 20, category, search },
      isAdmin,
    ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage?.meta?.page || 1;
      const totalPages = lastPage?.meta?.totalPages || 1;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useUnreadNotificationCountQuery(isAdmin = false) {
  const token = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: [...UNREAD_COUNT_QUERY_KEY, isAdmin],
    queryFn: () => fetchUnreadNotificationCount(token, isAdmin),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
    select: (data) => data?.unreadCount ?? 0,
  });
}

export function useMarkNotificationReadMutation(isAdmin = false) {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids) => markNotificationsRead(token, ids, isAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
  });
}

export function useMarkAllNotificationsReadMutation(isAdmin = false) {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(token, isAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
  });
}
