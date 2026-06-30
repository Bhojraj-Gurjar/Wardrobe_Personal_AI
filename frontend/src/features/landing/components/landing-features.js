'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Camera,
  ChevronRight,
  MessageCircle,
  Ruler,
  ScanFace,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { LANDING_FEATURES } from '@/features/landing/constants/landing-content';
import { cn } from '@/utils/cn';

const ICON_MAP = {
  sparkles: Sparkles,
  scan: ScanFace,
  ruler: Ruler,
  camera: Camera,
  message: MessageCircle,
  trending: TrendingUp,
};

function FeatureIcon({ type, className }) {
  const Icon = ICON_MAP[type] || Sparkles;
  return <Icon className={className} />;
}

export function LandingFeatures() {
  const featured = LANDING_FEATURES.find((f) => f.featured);
  const rest = LANDING_FEATURES.filter((f) => !f.featured);

  return (
    <section id="features" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Zap className="size-3.5" />
            Everything you need
          </span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Fashion intelligence,{' '}
            <span className="landing-gradient-text-alt">end-to-end.</span>
          </h2>
          <p className="mt-4 text-base text-white/55 sm:text-lg">
            Six AI-powered features that work together to give you a complete,
            personalized fashion experience.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {featured ? (
            <Link
              href={featured.href}
              className={cn(
                'interactive-card group relative overflow-hidden rounded-3xl border border-white/10',
                'bg-[#111827]/80 lg:row-span-2',
              )}
            >
              <div className="relative aspect-[4/3] overflow-hidden lg:aspect-auto lg:h-64">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/40 to-transparent" />
              </div>
              <div className="relative p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary transition-transform group-hover:scale-110">
                    <Sparkles className="size-5" />
                  </span>
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      featured.badgeClass,
                    )}
                  >
                    {featured.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">{featured.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {featured.description}
                </p>
                <span
                  className={cn(
                    'mt-4 inline-flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2',
                    featured.accentClass,
                  )}
                >
                  Learn more
                  <ChevronRight className="size-4" />
                </span>
              </div>
            </Link>
          ) : null}

          {rest.slice(0, 2).map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}

          {rest.slice(2).map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              className={feature.image ? 'lg:col-span-1' : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, className }) {
  return (
    <Link
      href={feature.href}
      className={cn(
        'interactive-card group flex flex-col overflow-hidden rounded-3xl border border-white/10',
        'bg-[#111827]/80 transition-all duration-200 hover:border-white/20',
        className,
      )}
    >
      {feature.image ? (
        <div className="relative h-40 overflow-hidden">
          <Image
            src={feature.image}
            alt={feature.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="400px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent" />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 transition-transform duration-200 group-hover:scale-110',
              feature.accentClass,
            )}
          >
            <FeatureIcon type={feature.icon} className="size-5" />
          </span>
          <span
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
              feature.badgeClass,
            )}
          >
            {feature.badge}
          </span>
        </div>
        <h3 className="text-lg font-bold text-white">{feature.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">
          {feature.description}
        </p>
        <span
          className={cn(
            'mt-4 inline-flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2',
            feature.accentClass,
          )}
        >
          Learn more
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
