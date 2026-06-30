'use client';

import Link from 'next/link';
import { LANDING_STATS } from '@/features/landing/constants/landing-content';
import { cn } from '@/utils/cn';

export function LandingStats() {
  return (
    <section className="border-y border-white/5 bg-[#0a0814]/80">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
        {LANDING_STATS.map((stat) => (
          <Link
            key={stat.label}
            href="#features"
            className={cn(
              'interactive-card group rounded-2xl border border-transparent p-4 text-center',
              'transition-all duration-200 hover:border-white/10 hover:bg-white/[0.03]',
            )}
          >
            <p
              className={cn(
                'text-3xl font-bold transition-transform duration-200 group-hover:scale-105 sm:text-4xl',
                stat.color,
              )}
            >
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-white/50 transition-colors group-hover:text-white/70">
              {stat.label}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
