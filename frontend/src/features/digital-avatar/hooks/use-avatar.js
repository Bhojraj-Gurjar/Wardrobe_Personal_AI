'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import {
  fetchAvatar,
  fetchAvatarGenerationProfile,
  generateAvatar,
  saveAvatarLookToCloset,
  saveAvatarOutfit,
  updateAvatar,
} from '@/features/digital-avatar/services/avatar.service';
import { useAuthStore } from '@/stores/auth-store';

export const AVATAR_QUERY_KEY = ['avatar'];

export function useAvatarQuery() {
  const token = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: AVATAR_QUERY_KEY,
    queryFn: () => fetchAvatar(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.LONG,
    retry: 1,
  });
}

export function useGenerateAvatarMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => generateAvatar(token, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(AVATAR_QUERY_KEY, data);
    },
  });
}

export function useUpdateAvatarMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateAvatar(token, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(AVATAR_QUERY_KEY, data);
    },
  });
}

export function useSaveAvatarOutfitMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => saveAvatarOutfit(token, payload),
    onSuccess: (outfit) => {
      queryClient.setQueryData(AVATAR_QUERY_KEY, (current) => (
        current ? { ...current, outfit } : current
      ));
    },
  });
}

export function useSaveAvatarLookToClosetMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => saveAvatarLookToCloset(token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-closet'] });
    },
  });
}

export function useAvatarGenerationProfileQuery() {
  const token = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: [...AVATAR_QUERY_KEY, 'generation-profile'],
    queryFn: () => fetchAvatarGenerationProfile(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.DEFAULT,
  });
}
