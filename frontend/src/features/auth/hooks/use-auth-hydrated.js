'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

const STORAGE_KEY = 'wardrobe-auth-sessions';
const LEGACY_STORAGE_KEY = 'wardrobe-auth';

export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist?.hasHydrated?.() ?? false,
  );

  useEffect(() => {
    const store = useAuthStore.persist;

    if (store?.hasHydrated?.()) {
      setHydrated(true);
    }

    return store?.onFinishHydration?.(() => setHydrated(true));
  }, []);

  return hydrated;
}

export function readPersistedAuthSession(context = 'user') {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!legacyRaw) {
        return null;
      }

      const legacyParsed = JSON.parse(legacyRaw);
      const legacySession = legacyParsed?.state ?? legacyParsed ?? null;
      if (!legacySession?.accessToken) {
        return null;
      }

      if (context === 'admin') {
        return legacySession.user?.role === 'ADMIN' ? legacySession : null;
      }

      return legacySession.user?.role === 'ADMIN' ? null : legacySession;
    }

    const parsed = JSON.parse(raw);
    const state = parsed?.state ?? parsed ?? null;
    const sessionKey = context === 'admin' ? 'adminSession' : 'userSession';
    return state?.[sessionKey] ?? null;
  } catch {
    return null;
  }
}
