'use client';

import { Sparkles } from 'lucide-react';
import { APP_NAME } from '@/constants/app';
import { cn } from '@/utils/cn';

export function FaceAuthLayout({ title, subtitle, children, footer, className }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070B1A] px-6 py-10">
      <div className={cn('flex w-full max-w-[480px] flex-col items-center', className)}>
        <div className="mb-10 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#7C3AED]">
            <Sparkles className="size-5 text-white" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold uppercase tracking-[0.18em] text-white">
            {APP_NAME}
          </span>
        </div>

        {title ? (
          <div className="mb-10 space-y-3 text-center">
            <h1 className="text-[42px] font-bold leading-tight text-white">{title}</h1>
            {subtitle ? (
              <p className="text-sm leading-relaxed text-white/55">{subtitle}</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex w-full flex-col items-center">{children}</div>

        {footer ? <div className="mt-8 w-full">{footer}</div> : null}
      </div>
    </div>
  );
}

export const faceAuthPrimaryButtonClass = cn(
  'flex h-14 w-full items-center justify-center gap-2 rounded-full',
  'bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-base font-bold text-white',
  'transition-all duration-200 hover:shadow-[0_0_28px_rgba(124,58,237,0.45)]',
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none',
);

export const faceAuthStatusTextClass = 'mt-6 text-center text-sm text-white/55';

export const faceAuthBackLinkClass =
  'inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-white/80 disabled:opacity-50';

export function FaceAuthRetryActions({ message, onRetry, disabled = false }) {
  if (!message) {
    return null;
  }

  return (
    <div className="mt-6 flex w-full max-w-sm flex-col items-center gap-4">
      <p className="text-center text-sm text-red-400" role="alert">
        {message}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={disabled}
          className={cn(faceAuthPrimaryButtonClass, 'max-w-xs')}
        >
          Try Again
        </button>
      ) : null}
    </div>
  );
}
