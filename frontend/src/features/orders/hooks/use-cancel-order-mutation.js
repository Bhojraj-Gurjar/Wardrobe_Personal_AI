'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelOrder } from '@/features/orders/services';
import { useAuthStore } from '@/stores/auth-store';

export function useCancelOrderMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId) => cancelOrder(orderId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
