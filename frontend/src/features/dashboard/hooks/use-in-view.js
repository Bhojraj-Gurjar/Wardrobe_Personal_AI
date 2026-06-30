'use client';

import { useEffect, useRef, useState } from 'react';

export function useInView({
  rootMargin = '120px',
  threshold = 0.01,
  once = true,
  disabled = false,
} = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (disabled || (once && inView)) {
      return undefined;
    }

    const element = ref.current;
    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [disabled, inView, once, rootMargin, threshold]);

  return { ref, inView };
}
