'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import {
  fashionDnaCardShell,
  fashionDnaCardTitleClass,
  formatScoreFraction,
  resolveConfidenceTier,
} from '@/features/fashion-dna/utils/fashion-dna-card-styles';

function ScoreRing({ score, variant = 'desktop', animatedScore }) {
  const isMobile = variant === 'mobile';
  const radius = isMobile ? 38 : 68;
  const size = isMobile ? 88 : 160;
  const stroke = isMobile ? 6 : 10;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const displayScore = animatedScore ?? score;
  const progress = (displayScore / 100) * circumference;

  return (
    <div
      className={cn(
        'relative mx-auto shrink-0',
        isMobile ? 'size-[88px]' : 'size-40',
      )}
      aria-hidden="true"
    >
      <svg className="size-full -rotate-90 overflow-visible" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={isMobile ? 'var(--dashboard-border)' : 'rgba(255,255,255,0.08)'}
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={isMobile ? 'url(#fashion-confidence-ring-gradient)' : '#8B5CF6'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-700 ease-out"
        />
        {isMobile ? (
          <defs>
            <linearGradient id="fashion-confidence-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            'font-bold leading-none text-dashboard-foreground',
            isMobile ? 'text-[26px]' : 'text-4xl',
          )}
        >
          {displayScore}
        </span>
        {!isMobile ? (
          <span className="text-xs text-dashboard-muted">/ 100</span>
        ) : null}
      </div>
    </div>
  );
}

export function FashionConfidenceCard({
  confidenceScore = 0,
  fashionPersonality,
  personalityDescription,
  isDefault = false,
  className,
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const score = Math.max(0, Math.round(Number(confidenceScore) || 0));
  const tier = resolveConfidenceTier(score);
  const personalityLabel = isDefault
    ? 'Profile Building'
    : fashionPersonality || 'Developing Profile';
  const description = personalityDescription
    || 'Complete onboarding and shopping activity to refine your fashion DNA.';

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedScore(score), 120);
    return () => clearTimeout(timeout);
  }, [score]);

  return (
    <section className={fashionDnaCardShell(className)}>
      <div className="md:hidden">
        <h3 className={cn(fashionDnaCardTitleClass, 'mb-2 text-center')}>
          Fashion Confidence
        </h3>

        <div className="flex flex-col items-center gap-2 text-center">
          <ScoreRing score={score} animatedScore={animatedScore} variant="mobile" />

          <div className="space-y-0.5">
            <p className="text-xs leading-none text-dashboard-foreground">
              {formatScoreFraction(score)}
            </p>
            <p className="text-[11px] leading-snug text-dashboard-muted">
              Confidence: {tier}
            </p>
          </div>

          <span className="inline-flex max-w-full items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
            {personalityLabel}
          </span>

          <p className="max-w-xs text-[11px] leading-snug text-dashboard-muted">
            {description}
          </p>
        </div>
      </div>

      <div className="hidden md:flex md:h-full md:flex-col">
        <h3 className={fashionDnaCardTitleClass}>Fashion Confidence</h3>

        <div className="mt-6 flex flex-1 flex-col items-center justify-center text-center">
          <div className="relative flex size-40 items-center justify-center rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10">
            <ScoreRing score={score} animatedScore={animatedScore} variant="desktop" />
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-lg font-semibold text-dashboard-foreground">
              {personalityLabel}
            </p>
            <p className="max-w-xs text-sm text-dashboard-muted">{description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
