'use client';

import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/stores/auth-store';
import {
  NO_USER_SESSION,
  normalizeSessionForUser,
  useVirtualTryOnSessionStore,
} from '@/stores/virtual-try-on-session-store';

export function useVirtualTryOnSession() {
  const userId = useAuthStore((state) => state.user?.id);
  const patchSession = useVirtualTryOnSessionStore((state) => state.patchSession);
  const resetSession = useVirtualTryOnSessionStore((state) => state.resetSession);
  const session = useVirtualTryOnSessionStore(
    useShallow((state) => (
      userId
        ? normalizeSessionForUser(state.sessionsByUserId[userId])
        : NO_USER_SESSION
    )),
  );

  const updateSession = useCallback(
    (patch) => {
      if (!userId) {
        return;
      }

      patchSession(userId, patch);
    },
    [patchSession, userId],
  );

  const clearSession = useCallback(() => {
    if (!userId) {
      return;
    }

    resetSession(userId);
  }, [resetSession, userId]);

  return {
    userId,
    session,
    updateSession,
    clearSession,
  };
}
