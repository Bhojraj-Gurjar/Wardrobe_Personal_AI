'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

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

export function readPersistedAuthSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem('wardrobe-auth');
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed?.state ?? parsed ?? null;
  } catch {
    return null;
  }
}
