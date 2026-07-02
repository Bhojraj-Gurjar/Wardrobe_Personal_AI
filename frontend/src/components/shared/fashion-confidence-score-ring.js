'use client';

import { useId } from 'react';
import { cn } from '@/utils/cn';

/**
 * Filled SVG progress ring for Fashion DNA confidence scores (0–100).
 * Shared by Dashboard Fashion DNA card and Fashion DNA page.
 */
export function FashionConfidenceScoreRing({
  score,
  variant = 'desktop',
  animatedScore,
  className,
}) {
  const gradientId = useId();
  const isMobile = variant === 'mobile';
  const radius = isMobile ? 38 : 68;
  const size = isMobile ? 88 : 160;
  const stroke = isMobile ? 6 : 10;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const displayScore = animatedScore ?? normalizedScore;
  const progress = (displayScore / 100) * circumference;

  return (
    <div
      className={cn(
        'relative mx-auto shrink-0',
        isMobile ? 'size-[88px]' : 'size-40',
        className,
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
          stroke={isMobile ? `url(#${gradientId})` : '#8B5CF6'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-700 ease-out"
        />
        {isMobile ? (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
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
