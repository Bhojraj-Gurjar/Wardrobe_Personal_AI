'use client';

import { motion } from 'framer-motion';
import { Check, Loader2, X } from 'lucide-react';
import type { FaceLoginStatusStep } from '@/features/face/types/face-login.types';
import { cn } from '@/utils/cn';

type AuthenticationStatusProps = {
  steps: FaceLoginStatusStep[];
  className?: string;
};

function StepIcon({ status }: { status: FaceLoginStatusStep['status'] }) {
  if (status === 'complete') {
    return <Check className="size-3.5 text-emerald-400" aria-hidden="true" />;
  }

  if (status === 'error') {
    return <X className="size-3.5 text-[#EF4444]" aria-hidden="true" />;
  }

  if (status === 'active') {
    return <Loader2 className="size-3.5 animate-spin text-[#9333EA]" aria-hidden="true" />;
  }

  return <span className="size-2 rounded-full bg-white/20" aria-hidden="true" />;
}

export function AuthenticationStatus({ steps, className }: AuthenticationStatusProps) {
  return (
    <motion.ul
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('space-y-2', className)}
      aria-live="polite"
    >
      {steps.map((step) => (
        <motion.li
          key={step.id}
          layout
          className={cn(
            'flex items-center gap-2.5 text-sm transition-colors',
            step.status === 'complete' && 'text-emerald-400/90',
            step.status === 'active' && 'text-white/90',
            step.status === 'error' && 'text-[#EF4444]',
            step.status === 'pending' && 'text-white/40',
          )}
        >
          <StepIcon status={step.status} />
          <span>{step.label}</span>
        </motion.li>
      ))}
    </motion.ul>
  );
}
