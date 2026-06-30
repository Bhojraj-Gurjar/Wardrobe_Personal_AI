'use client';



import { memo, useMemo } from 'react';

import { ONBOARDING_STEPS } from '@/features/onboarding/constants/onboarding-steps';

import { cn } from '@/utils/cn';



export const ProgressStepper = memo(function ProgressStepper({

  currentStepIndex,

}) {

  const progress = useMemo(

    () => ((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100,

    [currentStepIndex],

  );



  return (

    <div className="space-y-4">

      <div className="flex items-center justify-between text-xs text-dashboard-muted">

        <span>

          Step {currentStepIndex + 1} of {ONBOARDING_STEPS.length}

        </span>

        <span>{Math.round(progress)}%</span>

      </div>



      <div className="h-2 overflow-hidden rounded-full bg-dashboard-surface-elevated">

        <div

          className="h-full rounded-full bg-primary transition-all duration-300"

          style={{ width: `${progress}%` }}

          role="progressbar"

          aria-valuenow={Math.round(progress)}

          aria-valuemin={0}

          aria-valuemax={100}

        />

      </div>



      <ol className="grid grid-cols-3 gap-2">

        {ONBOARDING_STEPS.map((step, index) => {

          const isComplete = index < currentStepIndex;

          const isCurrent = index === currentStepIndex;



          return (

            <li key={step.id} className="flex flex-col items-center gap-2">

              <span

                className={cn(

                  'flex size-8 items-center justify-center rounded-full text-xs font-bold',

                  isComplete && 'bg-primary text-primary-foreground',

                  isCurrent &&

                    'border-2 border-primary bg-dashboard-accent-soft text-primary',

                  !isComplete &&

                    !isCurrent &&

                    'border border-dashboard-border bg-dashboard-surface-elevated text-dashboard-muted',

                )}

                aria-current={isCurrent ? 'step' : undefined}

              >

                {index + 1}

              </span>

              <span

                className={cn(

                  'hidden text-center text-[11px] sm:block',

                  isCurrent

                    ? 'font-semibold text-dashboard-foreground'

                    : 'text-dashboard-muted',

                )}

              >

                {step.label}

              </span>

            </li>

          );

        })}

      </ol>

    </div>

  );

});

