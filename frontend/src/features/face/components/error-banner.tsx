'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

type ErrorBannerProps = {
  message: string | null;
  className?: string;
};

export function ErrorBanner({ message, className }: ErrorBannerProps) {
  return (
    <AnimatePresence mode="wait">
      {message ? (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'rounded-xl border border-[#EF4444]/25 bg-[#EF4444]/10 px-4 py-2.5 text-center',
            className,
          )}
          role="alert"
        >
          <p className="text-[12.5px] leading-snug text-[#EF4444]">
            <span aria-hidden="true" className="mr-1.5">
              🔴
            </span>
            {message}
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
