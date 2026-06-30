'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

type LoadingOverlayProps = {
  visible: boolean;
  message: string;
  className?: string;
};

export function LoadingOverlay({ visible, message, className }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2',
            'rounded-[32px] bg-[#0B1220]/55 backdrop-blur-[2px]',
            className,
          )}
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2
            className="size-8 animate-spin text-[#9333EA] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
            {message}
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
