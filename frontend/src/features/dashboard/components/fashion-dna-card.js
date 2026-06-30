'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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

function ScoreRing({ score, variant = 'desktop' }) {
  const isMobile = variant === 'mobile';
  const radius = isMobile ? 38 : 54;
  const size = isMobile ? 88 : 128;
  const stroke = isMobile ? 6 : 10;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  return (
    <div
      className={cn(
        'relative mx-auto shrink-0',
        isMobile ? 'size-[88px]' : 'size-32',
      )}
      aria-hidden="true"
    >
      <svg className="size-full -rotate-90 overflow-visible" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--dashboard-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#fashion-dna-ring-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
        />
        <defs>
          <linearGradient id="fashion-dna-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            'font-bold leading-none text-dashboard-foreground',
            isMobile ? 'text-[26px]' : 'text-3xl',
          )}
        >
          {score}
        </span>
      </div>
    </div>
  );
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
      <Skeleton className="size-32 rounded-full bg-dashboard-surface-elevated" />
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto h-5 w-28 rounded bg-dashboard-surface-elevated" />
        <Skeleton className="mx-auto h-4 w-36 rounded bg-dashboard-surface-elevated" />
        <Skeleton className="mx-auto h-4 w-24 rounded bg-dashboard-surface-elevated" />
      </div>
    </div>
  );
}

function FashionDNAMobileContent({ dna }) {
  const tier = resolveConfidenceTier(dna.score);
  const rank = formatRankLabel(dna.rankLabel);

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <ScoreRing score={dna.score} variant="mobile" />

      <div className="space-y-0.5">
        <p className="text-xs leading-none text-dashboard-foreground">
          {formatScoreFraction(dna.score)}
        </p>
        <p className="text-[11px] leading-snug text-dashboard-muted">
          Confidence: {tier}
        </p>
      </div>

      {rank ? (
        <span className="inline-flex max-w-full items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium capitalize text-emerald-400">
          {rank}
        </span>
      ) : null}
    </div>
  );
}

function FashionDNADesktopContent({ dna }) {
  return (
    <>
      <ScoreRing score={dna.score} variant="desktop" />

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

  return (
    <section
      className={cn(
        'interactive-card w-full min-w-0 overflow-hidden rounded-2xl border border-dashboard-border',
        'bg-gradient-to-b from-dashboard-surface via-dashboard-surface to-dashboard-surface-elevated/70',
        'p-3 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm',
        'md:flex md:h-full md:flex-col md:rounded-2xl md:bg-dashboard-surface md:p-5 md:shadow-none',
        className,
      )}
    >
      {/* Mobile layout (< md) */}
      <div className="md:hidden">
        <h3 className="mb-2 text-center text-base font-semibold tracking-tight text-dashboard-foreground">
          Fashion DNA
        </h3>

        {isLoading ? (
          <FashionDNAMobileSkeleton />
        ) : isEmpty ? (
          <p className="py-3 text-center text-xs leading-snug text-dashboard-muted">
            No Fashion DNA yet. Complete your profile and analysis to generate it.
          </p>
        ) : (
          <FashionDNAMobileContent dna={dna} />
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

      {/* Desktop layout (md+) — unchanged structure */}
      <div className="hidden md:flex md:h-full md:flex-col">
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
            <FashionDNADesktopContent dna={dna} />
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
