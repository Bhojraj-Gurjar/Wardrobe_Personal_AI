'use client';

import { useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { useSession } from '@/features/auth/components/session-provider';
import { useAuthHydrated } from '@/features/auth/hooks/use-auth-hydrated';
import { FASHION_DNA_QUERY_KEY } from '@/features/fashion-dna/hooks/use-fashion-dna';
import { scheduleFashionDnaInvalidation } from '@/features/fashion-dna/utils/schedule-fashion-dna-invalidation';
import {
  invalidateQueryKeys,
  prependVirtualTryOnResult,
} from '@/lib/query-invalidation';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';
import { useVirtualTryOnSessionStore } from '@/stores/virtual-try-on-session-store';
import {
  addVirtualTryOnResultToCloset,
  deleteVirtualTryOnResult,
  fetchVirtualTryOnProducts,
  fetchVirtualTryOnResults,
  fetchVirtualTryOnSetup,
  generateVirtualTryOn,
  generateVirtualTryOnOutfit,
  saveVirtualTryOnResultOutfit,
} from '../services/virtual-try-on.service';

export const VIRTUAL_TRY_ON_SETUP_KEY = ['virtual-try-on', 'setup'];
export const VIRTUAL_TRY_ON_PRODUCTS_KEY = ['virtual-try-on', 'products'];
export const VIRTUAL_TRY_ON_RESULTS_KEY = ['virtual-try-on', 'results'];

export function useVirtualTryOnSetupQuery() {
  const hydrated = useAuthHydrated();
  const token = useUserAccessToken();
  const { isVerified } = useSession();

  return useQuery({
    queryKey: VIRTUAL_TRY_ON_SETUP_KEY,
    queryFn: () => fetchVirtualTryOnSetup(token),
    enabled: hydrated && Boolean(token) && isVerified,
    staleTime: QUERY_STALE_TIME.SHORT,
    retry: 1,
  });
}

export function useVirtualTryOnProductsQuery(params = {}) {
  const hydrated = useAuthHydrated();
  const token = useUserAccessToken();
  const { isVerified } = useSession();

  return useQuery({
    queryKey: [...VIRTUAL_TRY_ON_PRODUCTS_KEY, params],
    queryFn: () => fetchVirtualTryOnProducts(params, token),
    enabled: hydrated && Boolean(token) && isVerified,
    staleTime: QUERY_STALE_TIME.LONG,
  });
}

export function useVirtualTryOnResultsQuery() {
  const hydrated = useAuthHydrated();
  const token = useUserAccessToken();
  const { isVerified } = useSession();

  return useQuery({
    queryKey: VIRTUAL_TRY_ON_RESULTS_KEY,
    queryFn: () => fetchVirtualTryOnResults(token),
    enabled: hydrated && Boolean(token) && isVerified,
    staleTime: QUERY_STALE_TIME.SHORT,
  });
}

export function useGenerateVirtualTryOnMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();
  const abortRef = useRef(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const mutation = useMutation({
    mutationFn: ({ productId, productIds, temporaryBodyImageUrl }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const ids = productIds?.length
        ? productIds
        : productId
          ? [productId]
          : [];

      if (ids.length > 1) {
        return generateVirtualTryOnOutfit(ids, token, {
          temporaryBodyImageUrl,
          signal: controller.signal,
        });
      }

      return generateVirtualTryOn(ids[0], token, {
        temporaryBodyImageUrl,
        signal: controller.signal,
      });
    },
    onSuccess: (data, variables) => {
      abortRef.current = null;

      if (data?.result) {
        queryClient.setQueryData(VIRTUAL_TRY_ON_RESULTS_KEY, (existing) =>
          prependVirtualTryOnResult(existing, data.result),
        );
      }

      const userId = useAuthStore.getState().userSession.user?.id;

      if (userId && data?.result) {
        useVirtualTryOnSessionStore.getState().patchSession(userId, {
          latestResult: {
            bodyPhotoUrl: data.bodyPhotoUrl || null,
            generatedImageUrl: data.generatedImageUrl || data.result?.generatedImageUrl || null,
            result: data.result,
          },
          pendingProductId: null,
          selectedProductId: variables?.productId || variables?.productIds?.[0] || null,
          tryOnMode: data.tryOnMode || null,
          tryOnModeLabel: data.tryOnModeLabel || null,
        });
      }

      invalidateQueryKeys(queryClient, [
        VIRTUAL_TRY_ON_RESULTS_KEY,
        VIRTUAL_TRY_ON_SETUP_KEY,
        FASHION_DNA_QUERY_KEY,
      ]);
      scheduleFashionDnaInvalidation();
    },
    onSettled: () => {
      abortRef.current = null;
    },
  });

  return { ...mutation, abort };
}

export function useDeleteTryOnResultMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resultId) => deleteVirtualTryOnResult(resultId, token),
    onSuccess: (_data, resultId) => {
      queryClient.setQueryData(VIRTUAL_TRY_ON_RESULTS_KEY, (existing) => {
        if (Array.isArray(existing)) {
          return existing.filter((item) => item?.id !== resultId);
        }

        const items = Array.isArray(existing?.items)
          ? existing.items
          : Array.isArray(existing?.results)
            ? existing.results
            : [];
        const nextItems = items.filter((item) => item?.id !== resultId);

        return {
          ...existing,
          items: nextItems,
          results: nextItems,
        };
      });

      invalidateQueryKeys(queryClient, [VIRTUAL_TRY_ON_RESULTS_KEY]);
    },
  });
}

export function useSaveTryOnResultOutfitMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ resultId, name }) => saveVirtualTryOnResultOutfit(resultId, { name }, token),
    onSuccess: () => {
      invalidateQueryKeys(queryClient, [
        ['personal-closet'],
        FASHION_DNA_QUERY_KEY,
      ]);
      scheduleFashionDnaInvalidation();
    },
  });
}

export function useAddTryOnResultToClosetMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resultId) => addVirtualTryOnResultToCloset(resultId, token),
    onSuccess: () => {
      invalidateQueryKeys(queryClient, [['personal-closet']]);
    },
  });
}