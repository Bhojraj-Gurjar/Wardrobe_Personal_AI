'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

export function FashionConfidenceCard({
  confidenceScore = 0,
  fashionPersonality,
  personalityDescription,
  isDefault = false,
  className,
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const score = Math.max(0, Math.round(Number(confidenceScore) || 0));

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedScore(score), 120);
    return () => clearTimeout(timeout);
  }, [score]);

  return (
    <section
      className={cn(
        'flex h-full flex-col rounded-[24px] border border-dashboard-border',
        'bg-[#1A2235] p-6 shadow-lg',
        className,
      )}
    >
      <h3 className="text-base font-semibold text-dashboard-foreground">
        Fashion Confidence
      </h3>

      <div className="mt-6 flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative flex size-40 items-center justify-center rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
            <circle
              cx="80"
              cy="80"
              r="68"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="10"
            />
            <circle
              cx="80"
              cy="80"
              r="68"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(animatedScore / 100) * 427} 427`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div>
            <p className="text-4xl font-bold text-dashboard-foreground">{animatedScore}</p>
            <p className="text-xs text-dashboard-muted">/ 100</p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-lg font-semibold text-dashboard-foreground">
            {isDefault
              ? 'Profile Building'
              : fashionPersonality || 'Developing Profile'}
          </p>
          <p className="max-w-xs text-sm text-dashboard-muted">
            {personalityDescription
              || 'Complete onboarding and shopping activity to refine your fashion DNA.'}
          </p>
        </div>
      </div>
    </section>
  );
}
