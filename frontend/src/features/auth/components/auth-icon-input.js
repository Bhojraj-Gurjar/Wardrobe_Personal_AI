'use client';

import { cn } from '@/utils/cn';

export function AuthIconInput({
  id,
  icon: Icon,
  className,
  inputClassName,
  ...props
}) {
  return (
    <div className={cn('relative', className)}>
      <Icon
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-auth-panel-muted"
        aria-hidden="true"
      />
      <input
        id={id}
        className={cn(
          'flex h-12 w-full rounded-xl border border-auth-input-border bg-auth-input-bg',
          'pl-11 pr-4 text-sm text-auth-panel-foreground',
          'placeholder:text-auth-panel-muted/70',
          'transition-all duration-300 ease-out',
          'hover:border-white/[0.18]',
          'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-purple-500/20',
          'focus-visible:shadow-[0_0_20px_rgba(139,92,246,0.12)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          inputClassName,
        )}
        {...props}
      />
    </div>
  );
}
