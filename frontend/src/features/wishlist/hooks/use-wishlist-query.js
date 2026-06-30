'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { scheduleFashionDnaInvalidation } from '@/features/fashion-dna/utils/schedule-fashion-dna-invalidation';
import {
  addToWishlist,
  fetchWishlist,
  removeFromWishlist,
} from '@/features/wishlist/services';
import { useAuthStore } from '@/stores/auth-store';

export function useWishlistQuery() {
  const token = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['wishlist'],
    queryFn: () => fetchWishlist(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.DEFAULT,
  });
}

export function useAddToWishlistMutation() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: (productId) => addToWishlist(productId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      scheduleFashionDnaInvalidation();
    },
  });
}

export function useRemoveFromWishlistMutation() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: (id) => removeFromWishlist(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      scheduleFashionDnaInvalidation();
    },
  });
}
