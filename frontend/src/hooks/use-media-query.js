'use client';

import { useEffect, useState } from 'react';
import { BREAKPOINTS } from '@/constants/app';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const onChange = () => setMatches(mediaQuery.matches);

    onChange();
    mediaQuery.addEventListener('change', onChange);

    return () => mediaQuery.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export function useIsMobile() {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.MD - 1}px)`);
}

export function useIsTablet() {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.MD}px) and (max-width: ${BREAKPOINTS.LG - 1}px)`,
  );
}

export function useIsDesktop() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.LG}px)`);
}
