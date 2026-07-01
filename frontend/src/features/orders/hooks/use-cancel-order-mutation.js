'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelOrder } from '@/features/orders/services';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';

export function useCancelOrderMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId) => cancelOrder(orderId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
