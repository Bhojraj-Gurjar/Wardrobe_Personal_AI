'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  fashionDnaCardHeaderGapClass,
  fashionDnaCardShell,
  fashionDnaCardSubtitleClass,
  fashionDnaCardTitleClass,
} from '@/features/fashion-dna/utils/fashion-dna-card-styles';

export function CurrentStyleMoodCard({ mood, weeklyGrowth = 0, className }) {
  return (
    <section className={fashionDnaCardShell(className)}>
      <div className={cn('flex items-center gap-2.5 md:gap-3', fashionDnaCardHeaderGapClass)}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#C4B5FD] md:size-10 md:rounded-2xl">
          <Sparkles className="size-4 md:size-5" />
        </div>
        <div>
          <h3 className={fashionDnaCardTitleClass}>Current Style Mood</h3>
          <p className={fashionDnaCardSubtitleClass}>Your evolving style identity</p>
        </div>
      </div>

      <p className="text-xl font-bold text-dashboard-foreground md:text-2xl">
        {mood || 'Developing Profile'}
      </p>

      {weeklyGrowth > 0 ? (
        <p className="mt-1.5 text-xs text-emerald-400 md:mt-2 md:text-sm">
          Confidence grew +{weeklyGrowth} points this week from your activity.
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-dashboard-muted md:mt-2 md:text-sm">
          Keep browsing, trying on outfits, and shopping to sharpen your mood.
        </p>
      )}
    </section>
  );
}
