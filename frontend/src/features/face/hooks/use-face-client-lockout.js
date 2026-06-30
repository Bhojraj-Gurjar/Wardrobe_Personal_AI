'use client';

import { useCallback, useRef, useState } from 'react';

const STORAGE_KEY = 'wardrobe-face-login-lock';

export function useFaceClientLockout(maxFailures = 5, lockMs = 15 * 60 * 1000) {
  const [lockedUntil, setLockedUntil] = useState(() => readLockUntil());
  const failuresRef = useRef(readFailures());

  function readFailures() {
    if (typeof window === 'undefined') {
      return 0;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return 0;
      }

      const parsed = JSON.parse(raw);
      if (parsed.lockedUntil && Date.now() < parsed.lockedUntil) {
        return parsed.failures || maxFailures;
      }

      return parsed.failures || 0;
    } catch {
      return 0;
    }
  }

  function readLockUntil() {
    if (typeof window === 'undefined') {
      return 0;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return 0;
      }

      const parsed = JSON.parse(raw);
      if (parsed.lockedUntil && Date.now() < parsed.lockedUntil) {
        return parsed.lockedUntil;
      }

      return 0;
    } catch {
      return 0;
    }
  }

  const persist = useCallback((payload) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, []);

  const assertUnlocked = useCallback(() => {
    const until = readLockUntil();
    setLockedUntil(until);

    if (until && Date.now() < until) {
      const minutes = Math.max(1, Math.ceil((until - Date.now()) / 60000));
      throw new Error(`Too many failed attempts. Try again in ${minutes} minute(s).`);
    }
  }, []);

  const recordFailure = useCallback(() => {
    const failures = failuresRef.current + 1;
    failuresRef.current = failures;

    if (failures >= maxFailures) {
      const until = Date.now() + lockMs;
      setLockedUntil(until);
      persist({ failures, lockedUntil: until });
      return;
    }

    persist({ failures, lockedUntil: 0 });
  }, [lockMs, maxFailures, persist]);

  const recordSuccess = useCallback(() => {
    failuresRef.current = 0;
    setLockedUntil(0);
    persist({ failures: 0, lockedUntil: 0 });
  }, [persist]);

  const isLocked = Boolean(lockedUntil && Date.now() < lockedUntil);

  return {
    isLocked,
    lockedUntil,
    assertUnlocked,
    recordFailure,
    recordSuccess,
  };
}
