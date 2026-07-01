'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { scheduleFashionDnaInvalidation } from '@/features/fashion-dna/utils/schedule-fashion-dna-invalidation';
import {
  addCartItem,
  checkoutCart,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from '@/features/cart/services';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';

export function useCheckoutCartMutation() {
  const queryClient = useQueryClient();
  const token = useUserAccessToken();

  return useMutation({
    mutationFn: (couponCode) => checkoutCart(token, couponCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useAddCartItemMutation() {
  const queryClient = useQueryClient();
  const token = useUserAccessToken();

  return useMutation({
    mutationFn: ({ productId, quantity = 1 }) =>
      addCartItem(productId, token, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      scheduleFashionDnaInvalidation();
    },
  });
}

export function useCartQuery(coupon) {
  const token = useUserAccessToken();

  return useQuery({
    queryKey: ['cart', coupon || null],
    queryFn: () => fetchCart(token, coupon),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.DEFAULT,
  });
}

export function useUpdateCartItemMutation() {
  const queryClient = useQueryClient();
  const token = useUserAccessToken();

  return useMutation({
    mutationFn: ({ id, quantity }) => updateCartItem(id, quantity, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      scheduleFashionDnaInvalidation();
    },
  });
}

export function useRemoveCartItemMutation() {
  const queryClient = useQueryClient();
  const token = useUserAccessToken();

  return useMutation({
    mutationFn: (id) => removeCartItem(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      scheduleFashionDnaInvalidation();
    },
  });
}
