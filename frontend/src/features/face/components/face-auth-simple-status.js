'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { faceAuthStatusTextClass } from '@/features/face/components/face-auth-layout';

export function FaceAuthSimpleStatus({ message, isLoading = false, className }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn('flex items-center justify-center gap-2', faceAuthStatusTextClass, className)}
      aria-live="polite"
      aria-atomic="true"
    >
      {isLoading ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-[#9333EA]" aria-hidden="true" />
      ) : null}
      <p className="text-sm text-white/70">{message}</p>
    </div>
  );
}
