'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

export function ClosetAnimatedCounter({
  value = 0,
  className,
  formatter = (next) => String(next),
  duration = 900,
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const start = display;
    const startTime = performance.now();

    let frame = 0;

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(start + (target - start) * eased);
      setDisplay(next);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <span className={cn('tabular-nums', className)}>
      {formatter(display)}
    </span>
  );
}
