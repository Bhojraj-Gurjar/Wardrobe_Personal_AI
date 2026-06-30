'use client';

import { BellOff } from 'lucide-react';

export function NotificationEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center sm:py-14">
      <div className="relative mb-5 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 via-primary/10 to-transparent sm:size-24">
        <div className="absolute inset-2 rounded-full border border-primary/20" aria-hidden="true" />
        <BellOff className="size-9 text-primary/85 sm:size-10" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-dashboard-foreground sm:text-lg">
        You&apos;re all caught up!
      </h3>
      <p className="mt-1.5 max-w-[16rem] text-sm leading-relaxed text-dashboard-muted">
        We&apos;ll notify you when something important happens.
      </p>
    </div>
  );
}
