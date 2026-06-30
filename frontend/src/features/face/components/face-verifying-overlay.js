'use client';

import { Loader2 } from 'lucide-react';
import { FACE_VERIFYING_MESSAGE } from '@/features/face/constants/face-steps';
import { cn } from '@/utils/cn';

export function FaceVerifyingOverlay({ message = FACE_VERIFYING_MESSAGE, className }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2',
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
    </div>
  );
}
