'use client';

import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';
import {
  recordProductView,
  recordSearchQuery,
} from '@/features/user-activity/services/user-activity.service';
import { scheduleFashionDnaInvalidation } from '@/features/fashion-dna/utils/schedule-fashion-dna-invalidation';

export function trackProductView(productId) {
  const token = getUserAccessToken();
  if (!token || !productId) return Promise.resolve(null);

  return recordProductView(productId, token)
    .then((result) => {
      scheduleFashionDnaInvalidation();
      return result;
    })
    .catch(() => null);
}

export function trackSearchQuery(query) {
  const token = getUserAccessToken();
  const normalized = String(query || '').trim();
  if (!token || !normalized) return Promise.resolve(null);

  return recordSearchQuery(normalized, token)
    .then((result) => {
      scheduleFashionDnaInvalidation();
      return result;
    })
    .catch(() => null);
}
