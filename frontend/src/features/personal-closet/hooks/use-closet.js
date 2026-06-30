'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import {
  addOutfitToCart,
  deleteSavedOutfit,
  fetchClosetOverview,
  fetchFavoriteBrands,
  fetchFavoriteColors,
  fetchPurchasedItems,
  fetchSavedOutfits,
  removeFavoriteBrand,
  removeFavoriteColor,
  removePurchasedItem,
  searchCloset,
  updateSavedOutfit,
} from '@/features/personal-closet/services/personal-closet.service';
import { useAuthStore } from '@/stores/auth-store';

const CLOSET_QUERY_KEY = ['personal-closet'];

function invalidateCloset(queryClient) {
  queryClient.invalidateQueries({ queryKey: CLOSET_QUERY_KEY });
}

export function useClosetOverviewQuery() {
  const token = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: [...CLOSET_QUERY_KEY, 'overview'],
    queryFn: () => fetchClosetOverview(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.DEFAULT,
  });
}

export function usePurchasedItemsQuery(params = {}) {
  const token = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: [...CLOSET_QUERY_KEY, 'purchased', params],
    queryFn: () => fetchPurchasedItems(token, params),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.DEFAULT,
  });
}

export function useSavedOutfitsQuery() {
  const token = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: [...CLOSET_QUERY_KEY, 'outfits'],
    queryFn: () => fetchSavedOutfits(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.DEFAULT,
  });
}

export function useFavoriteBrandsQuery() {
  const token = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: [...CLOSET_QUERY_KEY, 'brands'],
    queryFn: () => fetchFavoriteBrands(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.DEFAULT,
  });
}

export function useFavoriteColorsQuery() {
  const token = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: [...CLOSET_QUERY_KEY, 'colors'],
    queryFn: () => fetchFavoriteColors(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.DEFAULT,
  });
}

export function useClosetSearchQuery(params, enabled = true) {
  const token = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: [...CLOSET_QUERY_KEY, 'search', params],
    queryFn: () => searchCloset(token, params),
    enabled: Boolean(token) && enabled,
    staleTime: QUERY_STALE_TIME.DEFAULT,
  });
}

export function useRemovePurchasedItemMutation() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: ({ orderId, productId }) =>
      removePurchasedItem(orderId, productId, token),
    onSuccess: () => invalidateCloset(queryClient),
  });
}

export function useDeleteOutfitMutation() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: (id) => deleteSavedOutfit(id, token),
    onSuccess: () => invalidateCloset(queryClient),
  });
}

export function useUpdateOutfitMutation() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: ({ id, ...body }) => updateSavedOutfit(id, body, token),
    onSuccess: () => invalidateCloset(queryClient),
  });
}

export function useAddOutfitToCartMutation() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: (id) => addOutfitToCart(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useRemoveFavoriteBrandMutation() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: (brandName) => removeFavoriteBrand(brandName, token),
    onSuccess: () => invalidateCloset(queryClient),
  });
}

export function useRemoveFavoriteColorMutation() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: (colorName) => removeFavoriteColor(colorName, token),
    onSuccess: () => invalidateCloset(queryClient),
  });
}

/** @deprecated Use granular hooks above. Kept for API parity with spec. */
export function useCloset() {
  const overview = useClosetOverviewQuery();
  const purchased = usePurchasedItemsQuery();
  const outfits = useSavedOutfitsQuery();
  const brands = useFavoriteBrandsQuery();
  const colors = useFavoriteColorsQuery();
  const removeItem = useRemovePurchasedItemMutation();
  const deleteOutfit = useDeleteOutfitMutation();

  return {
    getPurchasedItems: () => purchased.data?.items ?? [],
    getSavedOutfits: () => outfits.data ?? [],
    getFavoriteBrands: () => brands.data ?? [],
    getFavoriteColors: () => colors.data ?? [],
    removePurchasedItem: removeItem.mutateAsync,
    deleteOutfit: deleteOutfit.mutateAsync,
    overview: overview.data,
    isLoading:
      overview.isLoading
      || purchased.isLoading
      || outfits.isLoading
      || brands.isLoading
      || colors.isLoading,
  };
}
