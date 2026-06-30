'use client';

import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { FACE_DASHBOARD_CARD_CLASS } from '../constants/face-analysis-dashboard';

export function FaceTraitAnalysisCard({
  title,
  value,
  description,
  confidence,
  progressClass,
  icon: Icon,
  iconClass,
  swatch,
  hasReport,
  className,
}) {
  const showConfidence = hasReport && confidence > 0;

  return (
    <Card className={cn(FACE_DASHBOARD_CARD_CLASS, 'overflow-hidden', className)}>
      <CardContent className="flex h-full min-h-[220px] flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {swatch ? (
              <span
                className="size-10 shrink-0 rounded-full border border-white/15 shadow-inner"
                style={{ backgroundColor: swatch }}
              />
            ) : Icon ? (
              <span
                className={cn(
                  'flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#12182A]',
                  iconClass,
                )}
              >
                <Icon className="size-5" />
              </span>
            ) : null}
            <p className="text-[11px] font-semibold tracking-[0.22em] text-dashboard-muted">
              {title}
            </p>
          </div>

          {showConfidence ? (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#22C55E]">
              <CheckCircle2 className="size-4" />
              {confidence}%
            </span>
          ) : (
            <span className="text-sm font-medium text-dashboard-muted">0%</span>
          )}
        </div>

        <div className="mt-5 space-y-2">
          <h3
            className={cn(
              'font-bold tracking-tight text-white',
              hasReport ? 'text-3xl' : 'text-sm leading-snug text-dashboard-muted',
            )}
          >
            {value}
          </h3>
          {description ? (
            <p className="text-sm leading-relaxed text-dashboard-muted">{description}</p>
          ) : null}
        </div>

        <div className="mt-auto pt-6">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
            <div
              className={cn('h-full rounded-full transition-all duration-500', progressClass)}
              style={{ width: `${hasReport ? confidence : 0}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
