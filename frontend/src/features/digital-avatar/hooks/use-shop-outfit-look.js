'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ROUTES } from '@/constants/routes';
import { addCartItem } from '@/features/cart/services';
import { getSelectedOutfitProducts } from '@/features/digital-avatar/utils/outfit-builder.util';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';

export function useShopOutfitLook() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isShopping, setIsShopping] = useState(false);
  const [error, setError] = useState(null);

  const shopOutfitLook = useCallback(async (outfit) => {
    const selectedProducts = getSelectedOutfitProducts(outfit);

    if (!selectedProducts.length) {
      setError('Select at least one item to shop this look.');
      return false;
    }

    const token = getUserAccessToken();

    if (!token) {
      router.push(ROUTES.AUTH.LOGIN);
      return false;
    }

    setIsShopping(true);
    setError(null);

    try {
      await Promise.all(
        selectedProducts.map((product) => addCartItem(product.id, token, 1)),
      );

      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      router.push(`${ROUTES.CART}?checkout=1`);
      return true;
    } catch (err) {
      setError(err?.message || 'Could not add outfit to cart. Please try again.');
      return false;
    } finally {
      setIsShopping(false);
    }
  }, [queryClient, router]);

  return {
    shopOutfitLook,
    isShopping,
    error,
    clearError: () => setError(null),
  };
}
