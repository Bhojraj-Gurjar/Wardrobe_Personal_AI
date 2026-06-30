'use client';

import Link from 'next/link';
import { Sparkles, Zap } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export function ActionButtons({ className }) {
  return (
    <div className={cn('grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-3', className)}>
      <Button
        variant="outline"
        asChild
        className={cn(
          'h-10 rounded-full border-dashboard-border bg-dashboard-surface px-3 text-xs',
          'text-dashboard-foreground hover:bg-dashboard-surface-elevated',
          'sm:h-11 sm:rounded-xl sm:px-4 sm:text-sm',
        )}
      >
        <Link href={ROUTES.AI.STYLIST}>
          <Sparkles className="size-3.5 text-primary sm:size-4" aria-hidden="true" />
          Ask AI Stylist
        </Link>
      </Button>
      <Button
        asChild
        className={cn(
          'h-10 rounded-full bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/90',
          'sm:h-11 sm:rounded-xl sm:px-4 sm:text-sm',
        )}
      >
        <Link href={ROUTES.AI.VIRTUAL_TRY_ON}>
          <Zap className="size-3.5 sm:size-4" aria-hidden="true" />
          Virtual Try-On
        </Link>
      </Button>
    </div>
  );
}
