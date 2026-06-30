'use client';

import { UserRound } from 'lucide-react';
import { cn } from '@/utils/cn';

export function StudioBodyPhoto({
  src,
  alt = 'Body photo',
  className,
  imageClassName,
  fallback,
  aspectClassName = 'aspect-[3/4]',
  onImageError,
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10',
        aspectClassName,
        className,
      )}
    >
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#1c1c28] via-[#12121c] to-[#09090f]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_35%,_rgba(0,0,0,0.45)_100%)]"
        aria-hidden="true"
      />

      {src ? (
        <div className="relative flex h-full items-end justify-center px-3 pb-3 pt-4 sm:px-4 sm:pb-4">
          <div className="relative w-full max-w-[92%]">
            <div
              className="absolute bottom-1 left-1/2 h-3 w-[58%] -translate-x-1/2 rounded-[50%] bg-black/50 blur-md sm:h-4"
              aria-hidden="true"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              onError={onImageError}
              className={cn(
                'relative z-10 mx-auto max-h-full w-full object-contain object-bottom drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)]',
                imageClassName,
              )}
            />
          </div>
        </div>
      ) : (
        fallback || (
          <div className="relative flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-dashboard-muted">
            <UserRound className="size-12 opacity-40" aria-hidden="true" />
            <p className="text-sm">No body photo available</p>
          </div>
        )
      )}
    </div>
  );
}
