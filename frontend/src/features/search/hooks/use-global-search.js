'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';
import {
  clearSearchHistory,
  fetchSearchHistory,
  fetchSearchSuggestions,
} from '../services/global-search.service';
import {
  appendGuestSearchHistory,
  clearGuestSearchHistory,
  readGuestSearchHistory,
} from '../utils/search.utils';

export const SEARCH_SUGGEST_QUERY_KEY = ['search', 'suggest'];
export const SEARCH_HISTORY_QUERY_KEY = ['search', 'history'];

export function useSearchSuggestions(query, { enabled = true } = {}) {
  const debouncedQuery = useDebouncedValue(query, 300);
  const abortRef = useRef(null);

  const result = useQuery({
    queryKey: [...SEARCH_SUGGEST_QUERY_KEY, debouncedQuery],
    queryFn: async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      return fetchSearchSuggestions(debouncedQuery, {
        signal: controller.signal,
        limit: 8,
      });
    },
    enabled,
    staleTime: QUERY_STALE_TIME.SHORT,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
    retry: (failureCount, error) => {
      if (error?.name === 'AbortError') {
        return false;
      }

      return failureCount < 1;
    },
  });

  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    ...result,
    debouncedQuery,
  };
}

export function useSearchHistoryQuery(enabled = true) {
  const token = useUserAccessToken();

  return useQuery({
    queryKey: [...SEARCH_HISTORY_QUERY_KEY, Boolean(token)],
    queryFn: async () => {
      if (!token) {
        return { items: readGuestSearchHistory().map((query, index) => ({
          id: `guest-${index}`,
          query,
        })) };
      }

      return fetchSearchHistory(token);
    },
    enabled,
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useClearSearchHistory() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return async function clearHistory() {
    if (token) {
      await clearSearchHistory(token);
    } else {
      clearGuestSearchHistory();
    }

    queryClient.invalidateQueries({ queryKey: SEARCH_HISTORY_QUERY_KEY });
  };
}

export function rememberSearchQuery(query) {
  const normalized = String(query || '').trim();
  if (!normalized) {
    return;
  }

  const token = getUserAccessToken();

  if (!token) {
    appendGuestSearchHistory(normalized);
    return;
  }

  import('@/features/user-activity/services/user-activity.service')
    .then(({ recordSearchQuery }) => recordSearchQuery(normalized, token))
    .catch(() => null);
}

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function useMergedRecentSearches(historyData, trendingSearches = []) {
  return useMemo(() => {
    const recent = (historyData?.items || []).map((item) => item.query).filter(Boolean);
    const trending = (trendingSearches || []).filter(
      (term) => !recent.some((item) => item.toLowerCase() === String(term).toLowerCase()),
    );

    return { recent, trending };
  }, [historyData, trendingSearches]);
}
