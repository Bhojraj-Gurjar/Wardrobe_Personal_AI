'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import { fetchUserMedia } from '@/features/profile/services/user-media.service';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';

export const USER_MEDIA_QUERY_KEY = ['user-media'];

export function useUserMediaQuery() {
  const token = useUserAccessToken();

  return useQuery({
    queryKey: USER_MEDIA_QUERY_KEY,
    queryFn: () => fetchUserMedia(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.DEFAULT,
  });
}
