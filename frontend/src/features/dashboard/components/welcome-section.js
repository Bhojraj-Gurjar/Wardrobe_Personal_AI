'use client';

import { memo } from 'react';

export const WelcomeSection = memo(function WelcomeSection({ greeting, name }) {
  return (
    <section className="space-y-0.5 md:space-y-1">
      <p className="text-[10px] font-semibold tracking-[0.16em] text-dashboard-muted md:text-xs md:tracking-[0.2em]">
        {greeting}
      </p>
      <h2 className="text-xl font-bold leading-tight text-dashboard-foreground md:text-3xl lg:text-4xl">
        {name} ✨
      </h2>
      <p className="text-[11px] leading-snug text-dashboard-muted md:text-sm lg:text-base">
        Here&apos;s your personalized fashion overview for today.
      </p>
    </section>
  );
});
