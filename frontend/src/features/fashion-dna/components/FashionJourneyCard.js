'use client';

import { History } from 'lucide-react';
import { cn } from '@/utils/cn';

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
    <section
      className={cn(
        'rounded-[24px] border border-dashboard-border bg-[#1A2235] p-6',
        className,
      )}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-[#8B5CF6]/15 text-[#C4B5FD]">
          <History className="size-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-dashboard-foreground">Fashion Journey</h3>
          <p className="text-sm text-dashboard-muted">How your style has evolved over time</p>
        </div>
      </div>

      {journey.length ? (
        <div className="space-y-3">
          {journey.map((entry, index) => (
            <div
              key={`${entry.archivedAt}-${index}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
            >
              <div>
                <p className="font-medium text-dashboard-foreground">
                  {entry.styleType || 'Style update'}
                </p>
                <p className="text-xs text-dashboard-muted">
                  {formatDate(entry.archivedAt)}
                  {entry.changeSource ? ` · ${String(entry.changeSource).replace(/_/g, ' ')}` : ''}
                </p>
              </div>
              <span className="rounded-full bg-[#8B5CF6]/15 px-3 py-1 text-sm font-semibold text-[#C4B5FD]">
                {entry.confidenceScore || 0}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-dashboard-muted">
          Your journey timeline will appear after your first DNA refresh from shopping activity.
        </p>
      )}
    </section>
  );
}
