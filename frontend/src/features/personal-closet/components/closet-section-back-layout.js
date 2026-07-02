'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getClosetTabHref } from '@/features/personal-closet/constants/closet-navigation';

export function ClosetSectionBackLayout({
  title,
  description,
  backTab,
  children,
}) {
  return (
    <div className="-mx-4 space-y-8 px-4 pb-10 animate-in fade-in duration-500 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
      <div className="space-y-4">
        <Link
          href={getClosetTabHref(backTab)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C4B5FD] transition hover:text-[#E9D5FF] hover:underline"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Back to Personal Closet
        </Link>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A855F7]">
            {title}
          </p>
          {description ? (
            <p className="mt-1 text-sm text-white/50">{description}</p>
          ) : null}
        </div>
      </div>

      {children}
    </div>
  );
}
