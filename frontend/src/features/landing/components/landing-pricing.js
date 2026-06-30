'use client';

import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { LANDING_PRICING } from '@/features/landing/constants/landing-content';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export function LandingPricing() {
  return (
    <section id="pricing" className="scroll-mt-24 border-t border-white/5 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Pricing</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Invest in your style.
          </h2>
          <p className="mt-3 text-base text-white/55">
            One monthly price for an AI stylist that actually knows you.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {LANDING_PRICING.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'interactive-card group relative flex flex-col rounded-3xl border p-6 sm:p-8',
                'transition-all duration-200',
                plan.highlighted
                  ? 'border-primary bg-[#111827] shadow-xl shadow-primary/20 hover:border-primary hover:shadow-primary/30'
                  : 'border-white/10 bg-[#111827]/60 hover:border-white/20',
              )}
            >
              {plan.badge ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/40">
                  {plan.badge}
                </span>
              ) : null}

              <div className="mb-6">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    plan.highlighted ? 'text-white' : 'text-white/50',
                  )}
                >
                  {plan.name}
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.period ? (
                    <span className="text-sm text-white/45">{plan.period}</span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-white/50">{plan.description}</p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-white/70">
                    <Check className={cn('mt-0.5 size-4 shrink-0', plan.checkClass)} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={cn(
                  'inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 hover:scale-[1.02]',
                  plan.highlighted
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90'
                    : 'border border-white/15 bg-white/5 text-white hover:bg-white/10',
                )}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingCta() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.2),transparent_65%)]" />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          Your Fashion DNA awaits
        </span>
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          The wardrobe you{' '}
          <span className="landing-gradient-text">always wanted.</span>
        </h2>
        <p className="mt-4 text-base text-white/55 sm:text-lg">
          Join 50,000+ users who already dress smarter, shop less, and feel more
          confident every single day.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-primary px-8 shadow-xl shadow-primary/30 transition-all duration-200 hover:scale-[1.03] hover:shadow-primary/50"
          >
            <Link href={ROUTES.AUTH.REGISTER}>Start for Free →</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-full border-white/15 bg-transparent px-8 text-white transition-all duration-200 hover:scale-[1.02] hover:border-primary/40 hover:bg-white/5"
          >
            <Link href={ROUTES.AUTH.LOGIN}>Sign in</Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-white/45">
          <span>🛡️ No credit card</span>
          <span>⚡ Setup in 3 min</span>
          <span>🌐 100+ brands</span>
        </div>
      </div>
    </section>
  );
}
