'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

function ScoreRing({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative mx-auto size-32">
      <svg className="size-full -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--dashboard-border)"
          strokeWidth="10"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-dashboard-foreground">{score}</span>
      </div>
    </div>
  );
}

export function FashionDNACard({ dna, isLoading = false, className }) {
  const isEmpty = !isLoading && (dna?.isEmpty || dna?.score === null);

  return (
    <section
      className={cn(
        'interactive-card flex h-full flex-col rounded-2xl border border-dashboard-border',
        'bg-dashboard-surface p-5',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-bold tracking-[0.15em] text-dashboard-foreground">
            FASHION DNA
          </h3>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 flex-col items-center gap-4 py-4">
          <Skeleton className="size-32 rounded-full bg-dashboard-surface-elevated" />
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto h-5 w-28 rounded bg-dashboard-surface-elevated" />
            <Skeleton className="mx-auto h-4 w-36 rounded bg-dashboard-surface-elevated" />
            <Skeleton className="mx-auto h-4 w-24 rounded bg-dashboard-surface-elevated" />
          </div>
          <Skeleton className="mt-auto h-10 w-full rounded-xl bg-dashboard-surface-elevated" />
        </div>
      ) : isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
          <p className="text-sm text-dashboard-muted">
            No Fashion DNA yet. Complete your profile and analysis to generate it.
          </p>
        </div>
      ) : (
        <>
          <ScoreRing score={dna.score} />

          <div className="mt-4 space-y-1 text-center">
            <p className="text-lg font-semibold text-dashboard-foreground">
              {dna.confidenceLabel}
            </p>
            <p className="text-sm text-dashboard-muted">Confidence Score</p>
            <p className="text-sm font-medium text-dashboard-success">{dna.rankLabel}</p>
          </div>
        </>
      )}

      <Button
        asChild
        variant="outline"
        className={cn(
          'mt-auto w-full rounded-xl border-primary/30 bg-dashboard-accent-soft',
          'text-primary hover:bg-primary hover:text-primary-foreground',
        )}
      >
        <Link href={ROUTES.AI.FASHION_DNA} prefetch>
          View Full DNA Profile
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </section>
  );
}
