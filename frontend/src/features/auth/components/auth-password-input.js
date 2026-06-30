'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';

export function AuthPasswordInput({
  id,
  error,
  className,
  ...props
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn('relative', className)}>
      <Lock
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-auth-panel-muted"
        aria-hidden="true"
      />
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        aria-invalid={Boolean(error)}
        className={cn(
          'flex h-12 w-full rounded-xl border border-auth-input-border bg-auth-input-bg',
          'pl-11 pr-12 text-sm text-auth-panel-foreground',
          'placeholder:text-auth-panel-muted/70',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-auth-panel-muted hover:bg-auth-input-bg hover:text-auth-panel-foreground"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
