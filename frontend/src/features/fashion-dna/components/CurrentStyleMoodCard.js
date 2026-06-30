'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';

export function CurrentStyleMoodCard({ mood, weeklyGrowth = 0, className }) {
  return (
    <section
      className={cn(
        'rounded-[24px] border border-dashboard-border bg-[#1A2235] p-6',
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-[#8B5CF6]/15 text-[#C4B5FD]">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-dashboard-foreground">Current Style Mood</h3>
          <p className="text-sm text-dashboard-muted">Your evolving style identity</p>
        </div>
      </div>

      <p className="text-2xl font-bold text-dashboard-foreground">
        {mood || 'Developing Profile'}
      </p>

      {weeklyGrowth > 0 ? (
        <p className="mt-2 text-sm text-emerald-400">
          Confidence grew +{weeklyGrowth} points this week from your activity.
        </p>
      ) : (
        <p className="mt-2 text-sm text-dashboard-muted">
          Keep browsing, trying on outfits, and shopping to sharpen your mood.
        </p>
      )}
    </section>
  );
}
