'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { BODY_ANALYSIS_PROGRESS_STEPS } from '../constants/body-upload.constants';

export function BodyAnalysisProgressOverlay({
  open,
  phase = 'validating',
  success = false,
}) {
  const activeIndex = success
    ? BODY_ANALYSIS_PROGRESS_STEPS.length
    : Math.max(0, BODY_ANALYSIS_PROGRESS_STEPS.findIndex((step) => step.id === phase));

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#060b1f]/85 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111827]/95 p-6 shadow-2xl"
          >
            {success ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="size-12 text-emerald-400" />
                <p className="text-lg font-semibold text-dashboard-foreground">
                  Body Analysis Updated Successfully
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="size-5 animate-spin text-[#8B5CF6]" />
                  <p className="text-sm font-medium text-[#DDD6FE]">Running body analysis…</p>
                </div>

                <div className="space-y-3">
                  {BODY_ANALYSIS_PROGRESS_STEPS.map((step, index) => {
                    const isComplete = index < activeIndex;
                    const isActive = index === activeIndex;

                    return (
                      <div
                        key={step.id}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors',
                          isComplete && 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
                          isActive && 'border-[#8B5CF6]/35 bg-[#8B5CF6]/10 text-[#DDD6FE]',
                          !isComplete && !isActive && 'border-transparent text-dashboard-muted/70',
                        )}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                        ) : isActive ? (
                          <Loader2 className="size-4 shrink-0 animate-spin text-[#8B5CF6]" />
                        ) : (
                          <span className="size-4 shrink-0 rounded-full border border-dashboard-border" />
                        )}
                        <span>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
