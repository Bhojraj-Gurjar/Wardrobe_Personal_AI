'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

export function useFaceToast() {
  const [message, setMessage] = useState(null);

  const showToast = useCallback((text) => {
    setMessage(text);
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [message]);

  const Toast = useCallback(
    () =>
      message ? (
        <div
          role="alert"
          className={cn(
            'fixed bottom-6 left-1/2 z-50 max-w-sm -translate-x-1/2',
            'rounded-xl border border-red-500/30 bg-[#1A2235] px-4 py-3',
            'text-center text-sm text-red-300 shadow-xl',
            'animate-in fade-in slide-in-from-bottom-2 duration-300',
          )}
        >
          {message}
        </div>
      ) : null,
    [message],
  );

  return { showToast, Toast, clearToast: () => setMessage(null) };
}
