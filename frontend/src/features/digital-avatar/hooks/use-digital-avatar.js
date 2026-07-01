'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from '@/constants/app';
import {
  fetchDigitalAvatar,
  fetchDigitalAvatarHistory,
  generateDigitalAvatar,
  generateBasicAvatar,
  generatePremiumAvatar,
  activateDigitalAvatar,
  updateDigitalAvatar,
} from '@/features/digital-avatar/services';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';

export const DIGITAL_AVATAR_QUERY_KEY = ['digital-avatar'];
export const DIGITAL_AVATAR_HISTORY_QUERY_KEY = ['digital-avatar', 'history'];

export function useDigitalAvatarQuery() {
  const token = useUserAccessToken();

  return useQuery({
    queryKey: DIGITAL_AVATAR_QUERY_KEY,
    queryFn: async () => {
      try {
        return await fetchDigitalAvatar(token);
      } catch {
        return null;
      }
    },
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.LONG,
    retry: false,
  });
}

export function useDigitalAvatarHistoryQuery() {
  const token = useUserAccessToken();

  return useQuery({
    queryKey: DIGITAL_AVATAR_HISTORY_QUERY_KEY,
    queryFn: () => fetchDigitalAvatarHistory(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.DEFAULT,
  });
}

export function useGeneratePremiumAvatarMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generatePremiumAvatar(token),
    onSuccess: (data) => {
      queryClient.setQueryData(DIGITAL_AVATAR_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: DIGITAL_AVATAR_HISTORY_QUERY_KEY });
    },
  });
}

export function useGenerateBasicAvatarMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generateBasicAvatar(token),
    onSuccess: (data) => {
      queryClient.setQueryData(DIGITAL_AVATAR_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: DIGITAL_AVATAR_HISTORY_QUERY_KEY });
    },
  });
}

export function useGenerateDigitalAvatarMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => generateDigitalAvatar(token, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(DIGITAL_AVATAR_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: DIGITAL_AVATAR_HISTORY_QUERY_KEY });
    },
  });
}

export function useActivateDigitalAvatarMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (avatarId) => activateDigitalAvatar(avatarId, token),
    onSuccess: (data) => {
      queryClient.setQueryData(DIGITAL_AVATAR_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: DIGITAL_AVATAR_HISTORY_QUERY_KEY });
    },
  });
}

export function useUpdateDigitalAvatarMutation() {
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateDigitalAvatar(payload, token),
    onSuccess: (data) => {
      queryClient.setQueryData(DIGITAL_AVATAR_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: DIGITAL_AVATAR_HISTORY_QUERY_KEY });
    },
  });
}
