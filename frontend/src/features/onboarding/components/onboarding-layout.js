'use client';

import { Sparkles } from 'lucide-react';
import { APP_NAME } from '@/constants/app';
import { ProgressStepper } from '@/features/onboarding/components/progress-stepper';
import { cn } from '@/utils/cn';

export function OnboardingLayout({
  stepIndex,
  title,
  subtitle,
  children,
  className,
}) {
  return (
    <div
      className={cn(
        'min-h-screen px-4 py-8 sm:px-6',
        className,
      )}
      style={{ background: 'var(--onboarding-gradient)' }}
    >
      <div className="mx-auto w-full max-w-[900px] space-y-6">
        <header className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
              <Sparkles
                className="size-5 text-primary-foreground"
                aria-hidden="true"
              />
            </span>
            <p className="text-xs font-bold tracking-[0.22em] text-dashboard-muted">
              {APP_NAME.toUpperCase()}
            </p>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-dashboard-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="max-w-xl text-sm text-dashboard-muted sm:text-base">
              {subtitle}
            </p>
          </div>
        </header>

        <ProgressStepper currentStepIndex={stepIndex} />

        <section
          className="rounded-[var(--onboarding-card-radius)] border border-dashboard-border bg-dashboard-surface p-6 shadow-xl sm:p-8"
        >
          {children}
        </section>
      </div>
    </div>
  );
}
