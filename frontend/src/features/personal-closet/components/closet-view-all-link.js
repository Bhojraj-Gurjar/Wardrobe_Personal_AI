'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export function ClosetViewAllLink({ href, className }) {
  return (
    <Link
      href={href}
      prefetch
      className={cn(
        'flex shrink-0 items-center gap-0.5 text-xs font-medium text-[#C4B5FD] hover:text-[#E9D5FF] hover:underline md:gap-1 md:text-sm',
        className,
      )}
    >
      View all
      <ChevronRight className="size-3.5 md:size-4" aria-hidden="true" />
    </Link>
  );
}
