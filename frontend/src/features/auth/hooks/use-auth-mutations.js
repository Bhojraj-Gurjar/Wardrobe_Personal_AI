'use client';

import { useMutation } from '@tanstack/react-query';
import { AUTH_CONTEXT } from '@/features/auth/constants/auth-context';
import { loginRequest, registerRequest } from '@/features/auth/services';
import { establishSession } from '@/features/auth/utils/establish-session';

export function useLoginMutation() {
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      establishSession({
        context: AUTH_CONTEXT.USER,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: registerRequest,
    onSuccess: (data) => {
      establishSession({
        context: AUTH_CONTEXT.USER,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
    },
  });
}
