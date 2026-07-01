'use client';

import { useEffect, useRef, useState } from 'react';

const TOP_THRESHOLD = 8;
const SCROLL_DELTA = 4;

/**
 * Reveals the header when scrolling up or near the top; tucks it away on scroll down.
 * Uses rAF batching to avoid layout thrash during fast scroll.
 */
export function useSmartHeaderVisibility() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    function update() {
      const currentY = window.scrollY;
      const previousY = lastScrollY.current;
      const delta = currentY - previousY;

      if (currentY <= TOP_THRESHOLD) {
        setVisible(true);
      } else if (delta < -SCROLL_DELTA) {
        setVisible(true);
      } else if (delta > SCROLL_DELTA) {
        setVisible(false);
      }

      lastScrollY.current = currentY;
      ticking.current = false;
    }

    function onScroll() {
      if (ticking.current) {
        return;
      }

      ticking.current = true;
      requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return visible;
}
