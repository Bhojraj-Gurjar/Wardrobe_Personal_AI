'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationsRead,
} from '../services/notifications.service';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'];
export const UNREAD_COUNT_QUERY_KEY = ['notifications', 'unread-count'];

function patchNotificationsReadState(queryClient, ids, isAdmin, markAll = false) {
  queryClient.setQueriesData(
    { queryKey: [...NOTIFICATIONS_QUERY_KEY, isAdmin] },
    (current) => {
      if (!current?.pages) {
        return current;
      }

      const idSet = markAll ? null : new Set(ids);

      return {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          items: (page.items || []).map((item) => {
            if (markAll || idSet?.has(item.id)) {
              return { ...item, isRead: true };
            }
            return item;
          }),
        })),
      };
    },
  );

  queryClient.setQueryData([...UNREAD_COUNT_QUERY_KEY, isAdmin], (current) => {
    if (markAll) {
      return { unreadCount: 0 };
    }

    const previous = current?.unreadCount ?? 0;
    return { unreadCount: Math.max(0, previous - (ids?.length || 0)) };
  });
}

export function useNotificationsQuery({ category = 'ALL', search = '', isAdmin = false } = {}) {
  const token = useUserAccessToken();

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
  const token = useUserAccessToken();

  return useQuery({
    queryKey: [...UNREAD_COUNT_QUERY_KEY, isAdmin],
    queryFn: () => fetchUnreadNotificationCount(token, isAdmin),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.SHORT,
    select: (data) => data?.unreadCount ?? 0,
  });
}

export function useMarkNotificationReadMutation(isAdmin = false) {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids) => markNotificationsRead(token, ids, isAdmin),
    onMutate: (ids) => {
      patchNotificationsReadState(queryClient, ids, isAdmin);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
  });
}

export function useMarkAllNotificationsReadMutation(isAdmin = false) {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(token, isAdmin),
    onMutate: () => {
      patchNotificationsReadState(queryClient, [], isAdmin, true);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
  });
}
