'use client';

import { useEffect } from 'react';

/**
 * Mobile drawer behavior: ESC to close, body scroll lock, focus management.
 * UI-only — no business logic.
 */
export function useMobileDrawer(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);
}
