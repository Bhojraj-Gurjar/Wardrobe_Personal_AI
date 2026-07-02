'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { FashionConfidenceScoreRing } from '@/components/shared/fashion-confidence-score-ring';
import {
  fashionDnaCardShell,
  fashionDnaCardTitleClass,
  formatScoreFraction,
  resolveConfidenceTier,
} from '@/features/fashion-dna/utils/fashion-dna-card-styles';

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
          <FashionConfidenceScoreRing score={score} animatedScore={animatedScore} variant="mobile" />

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
            <FashionConfidenceScoreRing score={score} animatedScore={animatedScore} variant="desktop" />
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
