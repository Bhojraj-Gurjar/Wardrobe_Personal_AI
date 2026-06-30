'use client';

import { cn } from '@/utils/cn';
import { CHECKOUT_STEPS } from '@/features/checkout/constants/checkout.constants';

export function CheckoutStepper({ currentStep }) {
  const currentIndex = CHECKOUT_STEPS.findIndex((step) => step.id === currentStep);

  return (
    <ol className="mb-8 flex items-center justify-center gap-2 sm:gap-4">
      {CHECKOUT_STEPS.map((step, index) => {
        const isComplete = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <li key={step.id} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-full border text-sm font-semibold transition-all',
                  isComplete && 'border-primary bg-primary text-white',
                  isActive && 'border-primary bg-primary/15 text-primary shadow-[0_0_20px_rgba(124,58,237,0.35)]',
                  !isComplete && !isActive && 'border-dashboard-border text-dashboard-muted',
                )}
              >
                {index + 1}
              </span>
              <span className={cn('text-xs font-medium', isActive ? 'text-dashboard-foreground' : 'text-dashboard-muted')}>
                {step.label}
              </span>
            </div>
            {index < CHECKOUT_STEPS.length - 1 ? (
              <div className={cn('hidden h-px w-10 sm:block sm:w-16', isComplete ? 'bg-primary' : 'bg-dashboard-border')} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
