'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { BODY_DASHBOARD_CARD_CLASS, BODY_EMPTY_ANALYSIS_MESSAGE } from '../constants/body-analysis-dashboard';

const EMPTY_VALUE = '—';

export function BodyMeasurementsCard({ rows, hasAnalysis, sizeRecommendations, className }) {
  const sizes = sizeRecommendations || null;

  return (
    <Card className={cn(BODY_DASHBOARD_CARD_CLASS, className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-dashboard-foreground">
          Measurements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-6">
        {!hasAnalysis ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 text-center text-sm text-dashboard-muted">
            {BODY_EMPTY_ANALYSIS_MESSAGE}
          </div>
        ) : (
          <>
            {sizes ? (
              <div className="rounded-2xl border border-[#8B5CF6]/25 bg-[#8B5CF6]/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#C4B5FD]">
                  Recommended Sizes
                </p>
                <p className="mt-1.5 text-sm font-medium text-dashboard-foreground">
                  Shirt {sizes.shirt} · T-shirt {sizes.tShirt} · Jacket {sizes.jacket} · Pant {sizes.pant}
                </p>
                {sizes.why ? (
                  <p className="mt-1 text-xs leading-relaxed text-dashboard-muted">{sizes.why}</p>
                ) : null}
              </div>
            ) : null}
            {rows.map((row) => (
            <div
              key={row.label}
              className={cn(
                'flex items-center justify-between rounded-2xl border border-white/6',
                'bg-[#12182A]/70 px-4 py-3.5',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="size-2 rounded-full bg-[#8B5CF6]" aria-hidden="true" />
                <span className="text-sm text-dashboard-muted">{row.label}</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold leading-none text-white">
                  {row.inches ?? EMPTY_VALUE}
                  {row.inches !== null && row.inches !== undefined ? (
                    <span className="ml-0.5 text-lg font-semibold text-white/90">&quot;</span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-dashboard-muted">
                  {row.cm !== null && row.cm !== undefined ? `${row.cm} cm` : EMPTY_VALUE}
                </p>
              </div>
            </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
