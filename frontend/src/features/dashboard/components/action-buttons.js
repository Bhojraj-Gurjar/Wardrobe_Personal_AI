'use client';

import Link from 'next/link';
import { Sparkles, Zap } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export function ActionButtons({ className }) {
  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      <Button
        variant="outline"
        asChild
        className={cn(
          'h-11 rounded-xl border-dashboard-border bg-dashboard-surface',
          'text-dashboard-foreground hover:bg-dashboard-surface-elevated',
        )}
      >
        <Link href={ROUTES.AI.STYLIST}>
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          Ask AI Stylist
        </Link>
      </Button>
      <Button
        asChild
        className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Link href={ROUTES.AI.VIRTUAL_TRY_ON}>
          <Zap className="size-4" aria-hidden="true" />
          Virtual Try-On
        </Link>
      </Button>
    </div>
  );
}
