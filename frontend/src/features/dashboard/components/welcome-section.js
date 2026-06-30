'use client';

import { memo } from 'react';

export const WelcomeSection = memo(function WelcomeSection({ greeting, name }) {
  return (
    <section className="space-y-1">
      <p className="text-xs font-semibold tracking-[0.2em] text-dashboard-muted">
        {greeting}
      </p>
      <h2 className="text-3xl font-bold text-dashboard-foreground md:text-4xl">
        {name} ✨
      </h2>
      <p className="text-sm text-dashboard-muted md:text-base">
        Here&apos;s your personalized fashion overview for today.
      </p>
    </section>
  );
});
