'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks the live height of a pinned header node for layout spacer sizing.
 */
export function usePinnedHeaderHeight(ref) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return undefined;
    }

    const update = () => {
      setHeight(node.offsetHeight);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return height;
}
