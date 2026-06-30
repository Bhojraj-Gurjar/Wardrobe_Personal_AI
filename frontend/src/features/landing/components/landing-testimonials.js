'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import {
  LANDING_PRESS,
  LANDING_TESTIMONIALS,
} from '@/features/landing/constants/landing-content';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

export function LandingTestimonials() {
  return (
    <section className="border-t border-white/5 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            What People Say
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Worn by the fashion-forward.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {LANDING_TESTIMONIALS.map((item) => (
            <Link
              key={item.name}
              href={ROUTES.AUTH.REGISTER}
              className={cn(
                'interactive-card flex flex-col rounded-3xl border border-white/10',
                'bg-[#111827]/70 p-6 transition-all duration-200 hover:border-primary/25 hover:bg-[#111827]',
              )}
            >
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-white/80">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3 border-t border-white/5 pt-5">
                <div className="relative size-10 overflow-hidden rounded-full ring-2 ring-primary/20 transition-transform duration-200 group-hover:scale-105">
                  <Image src={item.avatar} alt={item.name} fill className="object-cover" sizes="40px" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-white/45">{item.role}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-white/35">
            As Featured In
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {LANDING_PRESS.map((brand) => (
              <span
                key={brand}
                className="cursor-default text-sm font-semibold text-white/25 transition-all duration-200 hover:scale-105 hover:text-white/50"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
