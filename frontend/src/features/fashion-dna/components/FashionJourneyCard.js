'use client';

import { History } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  fashionDnaCardHeaderGapClass,
  fashionDnaCardShell,
  fashionDnaCardSubtitleClass,
  fashionDnaCardTitleClass,
} from '@/features/fashion-dna/utils/fashion-dna-card-styles';

function formatDate(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function FashionJourneyCard({ journey = [], className }) {
  return (
    <section className={fashionDnaCardShell(className)}>
      <div className={cn('flex items-center gap-2.5 md:gap-3', fashionDnaCardHeaderGapClass)}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#C4B5FD] md:size-10 md:rounded-2xl">
          <History className="size-4 md:size-5" />
        </div>
        <div>
          <h3 className={fashionDnaCardTitleClass}>Fashion Journey</h3>
          <p className={fashionDnaCardSubtitleClass}>How your style has evolved over time</p>
        </div>
      </div>

      {journey.length ? (
        <div className="space-y-2 md:space-y-3">
          {journey.map((entry, index) => (
            <div
              key={`${entry.archivedAt}-${index}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 md:gap-4 md:rounded-2xl md:px-4 md:py-3"
            >
              <div>
                <p className="text-xs font-medium text-dashboard-foreground md:text-base">
                  {entry.styleType || 'Style update'}
                </p>
                <p className="text-[11px] text-dashboard-muted md:text-xs">
                  {formatDate(entry.archivedAt)}
                  {entry.changeSource ? ` · ${String(entry.changeSource).replace(/_/g, ' ')}` : ''}
                </p>
              </div>
              <span className="rounded-full bg-[#8B5CF6]/15 px-2.5 py-0.5 text-xs font-semibold text-[#C4B5FD] md:px-3 md:py-1 md:text-sm">
                {entry.confidenceScore || 0}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-dashboard-muted md:text-sm">
          Your journey timeline will appear after your first DNA refresh from shopping activity.
        </p>
      )}
    </section>
  );
}
