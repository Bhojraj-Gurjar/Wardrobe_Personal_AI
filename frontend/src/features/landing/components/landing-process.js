'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LANDING_PROCESS } from '@/features/landing/constants/landing-content';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';

export function LandingProcess() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-white/5 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            The Process
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            From zero to perfectly{' '}
            <span className="landing-gradient-text">dressed in minutes.</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {LANDING_PROCESS.map((step) => (
            <Link
              key={step.step}
              href={ROUTES.AUTH.REGISTER}
              className={cn(
                'interactive-card group relative overflow-hidden rounded-3xl border border-white/10',
                'bg-[#111827]/60 transition-all duration-300 hover:border-primary/30',
              )}
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06040f] via-[#06040f]/30 to-transparent" />
                <span
                  className={cn(
                    'absolute left-5 top-5 text-5xl font-black opacity-90',
                    step.accent,
                  )}
                >
                  {step.step}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {step.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
