'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FashionConfidenceScoreRing } from '@/components/shared/fashion-confidence-score-ring';
import { cn } from '@/utils/cn';

function resolveConfidenceTier(score) {
  if (score == null || !Number.isFinite(Number(score))) {
    return 'Pending';
  }

  const value = Number(score);
  if (value >= 70) return 'High';
  if (value >= 50) return 'Medium';
  if (value >= 30) return 'Moderate';
  return 'Developing';
}

function formatScoreFraction(score) {
  if (score == null || !Number.isFinite(Number(score))) {
    return '— / 100';
  }

  return `${Math.round(Number(score))} / 100`;
}

function formatRankLabel(label) {
  if (!label || typeof label !== 'string') {
    return '';
  }

  return label
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function FashionDNAMobileSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 py-1">
      <Skeleton className="size-[88px] rounded-full bg-dashboard-surface-elevated" />
      <Skeleton className="h-3.5 w-16 rounded bg-dashboard-surface-elevated" />
      <Skeleton className="h-3 w-28 rounded bg-dashboard-surface-elevated" />
      <Skeleton className="h-5 w-24 rounded-full bg-dashboard-surface-elevated" />
    </div>
  );
}

function FashionDNADesktopSkeleton() {
  return (
    <div className="flex flex-1 flex-col items-center gap-4 py-4">
      <Skeleton className="size-40 rounded-full bg-dashboard-surface-elevated" />
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto h-5 w-28 rounded bg-dashboard-surface-elevated" />
        <Skeleton className="mx-auto h-4 w-36 rounded bg-dashboard-surface-elevated" />
        <Skeleton className="mx-auto h-4 w-24 rounded bg-dashboard-surface-elevated" />
      </div>
    </div>
  );
}

function FashionDNAMobileContent({ dna, animatedScore }) {
  const tier = resolveConfidenceTier(dna.score);
  const rank = formatRankLabel(dna.rankLabel);
  const score = Math.max(0, Math.round(Number(dna.score) || 0));

  return (
    <div className="flex w-full max-w-full flex-col items-center gap-2 px-1 text-center">
      <FashionConfidenceScoreRing
        score={score}
        animatedScore={animatedScore}
        variant="mobile"
      />

      <div className="w-full max-w-full space-y-0.5">
        <p className="text-xs leading-none text-dashboard-foreground">
          {formatScoreFraction(dna.score)}
        </p>
        <p className="text-[11px] leading-snug text-dashboard-muted">
          Confidence: {tier}
        </p>
      </div>

      {rank ? (
        <span className="inline-flex max-w-[calc(100%-0.5rem)] items-center justify-center truncate rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium capitalize text-emerald-400">
          {rank}
        </span>
      ) : null}
    </div>
  );
}

function FashionDNADesktopContent({ dna, animatedScore }) {
  const score = Math.max(0, Math.round(Number(dna.score) || 0));

  return (
    <>
      <div className="relative flex size-40 items-center justify-center rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10">
        <FashionConfidenceScoreRing
          score={score}
          animatedScore={animatedScore}
          variant="desktop"
        />
      </div>

      <div className="mt-4 space-y-1 text-center">
        <p className="text-lg font-semibold text-dashboard-foreground">
          {dna.confidenceLabel}
        </p>
        <p className="text-sm text-dashboard-muted">Confidence Score</p>
        <p className="text-sm font-medium capitalize text-dashboard-success">{dna.rankLabel}</p>
      </div>
    </>
  );
}

export function FashionDNACard({ dna, isLoading = false, className }) {
  const isEmpty = !isLoading && (dna?.isEmpty || dna?.score === null);
  const score = Math.max(0, Math.round(Number(dna?.score) || 0));
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (isLoading || isEmpty) {
      setAnimatedScore(0);
      return;
    }

    const timeout = setTimeout(() => setAnimatedScore(score), 120);
    return () => clearTimeout(timeout);
  }, [isEmpty, isLoading, score]);

  return (
    <section
      className={cn(
        'interactive-card box-border w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-dashboard-border',
        'bg-gradient-to-b from-dashboard-surface via-dashboard-surface to-dashboard-surface-elevated/70',
        'p-3 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm',
        'lg:flex lg:h-full lg:flex-col lg:rounded-2xl lg:bg-dashboard-surface lg:p-5 lg:shadow-none',
        className,
      )}
    >
      {/* Mobile / tablet layout (< lg) — full-width stacked dashboard */}
      <div className="w-full min-w-0 lg:hidden">
        <h3 className="mb-2 text-center text-base font-semibold tracking-tight text-dashboard-foreground">
          Fashion DNA
        </h3>

        {isLoading ? (
          <FashionDNAMobileSkeleton />
        ) : isEmpty ? (
          <p className="px-1 py-3 text-center text-xs leading-snug text-dashboard-muted">
            No Fashion DNA yet. Complete your profile and analysis to generate it.
          </p>
        ) : (
          <FashionDNAMobileContent dna={dna} animatedScore={animatedScore} />
        )}

        <Button
          asChild
          variant="outline"
          className={cn(
            'mt-3 h-10 w-full rounded-full border-primary/30 bg-dashboard-accent-soft text-xs',
            'text-primary hover:bg-primary hover:text-primary-foreground',
          )}
        >
          <Link href={ROUTES.AI.FASHION_DNA} prefetch>
            View Full DNA Profile
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {/* Desktop sidebar layout (lg+) */}
      <div className="hidden lg:flex lg:h-full lg:flex-col">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-bold tracking-[0.15em] text-dashboard-foreground">
              FASHION DNA
            </h3>
          </div>
        </div>

        {isLoading ? (
          <FashionDNADesktopSkeleton />
        ) : isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
            <p className="text-sm text-dashboard-muted">
              No Fashion DNA yet. Complete your profile and analysis to generate it.
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center">
            <FashionDNADesktopContent dna={dna} animatedScore={animatedScore} />
          </div>
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
      </div>
    </section>
  );
}
