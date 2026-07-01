'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { consumeFaceAuthSuccessMessage } from '@/features/face/utils/face-auth-success';
import { cn } from '@/utils/cn';

const AUTO_DISMISS_MS = 5000;

export function FaceAuthSuccessBanner() {
  const [message, setMessage] = useState(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const successMessage = consumeFaceAuthSuccessMessage();
    if (successMessage) {
      setMessage(successMessage);
      const timer = setTimeout(() => setMessage(null), AUTO_DISMISS_MS);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  if (!message) {
    return null;
  }

  const dismiss = () => setMessage(null);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={prefersReducedMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
      animate={prefersReducedMotion ? false : { opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? false : { opacity: 0, y: -4 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border',
        'border-dashboard-success/35 bg-dashboard-surface-elevated/90',
        'shadow-[0_8px_32px_rgba(34,197,94,0.12)] backdrop-blur-sm',
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-dashboard-success via-emerald-400 to-dashboard-success"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-dashboard-success/10 blur-2xl"
      />

      <div className="relative flex items-start gap-3 px-4 py-3.5 sm:items-center sm:gap-4 sm:px-5 sm:py-4">
        <div
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-dashboard-success/30 bg-dashboard-success/15 text-dashboard-success shadow-[0_0_20px_rgba(34,197,94,0.2)]"
        >
          <CheckCircle2 className="size-5" strokeWidth={2.25} />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5 pr-6 sm:pr-0">
          <p className="text-sm font-semibold leading-snug text-dashboard-foreground sm:text-base">
            {message}
          </p>
          <p className="flex items-center gap-1.5 text-xs leading-relaxed text-dashboard-muted sm:text-sm">
            <ShieldCheck className="size-3.5 shrink-0 text-dashboard-success/80" aria-hidden="true" />
            <span>Face login is now enabled on your account.</span>
          </p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className={cn(
            'absolute right-3 top-3 rounded-lg p-1.5',
            'text-dashboard-muted transition-colors',
            'hover:bg-white/5 hover:text-dashboard-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-success/50',
          )}
          aria-label="Dismiss notification"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}
