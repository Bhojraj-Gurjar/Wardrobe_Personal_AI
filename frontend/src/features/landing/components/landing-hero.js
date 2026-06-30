'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Play, Sparkles, Star } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80&q=80',
];

export function LandingHero() {
  return (
    <section className="landing-grid relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_55%)]" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
        <div className="space-y-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary transition-all duration-200 hover:border-primary/50 hover:bg-primary/15">
            <Sparkles className="size-3.5" />
            AI-Powered Fashion Intelligence
          </span>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Dress Better.{' '}
              <span className="landing-gradient-text">Think Smarter.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
              Wardrobe AI decodes your unique Fashion DNA — your face shape, body type,
              color affinity, and style preferences — then curates outfits you&apos;ll
              actually wear.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-primary px-8 text-base shadow-xl shadow-primary/30 transition-all duration-200 hover:scale-[1.03] hover:bg-primary/90 hover:shadow-primary/50"
            >
              <Link href={ROUTES.AUTH.REGISTER}>
                Get Started Free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-full border-white/15 bg-white/5 px-6 text-base text-white backdrop-blur transition-all duration-200 hover:scale-[1.02] hover:border-primary/40 hover:bg-white/10"
            >
              <a href="#how-it-works">
                <Play className="size-4 fill-primary text-primary" />
                Watch Demo
              </a>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex -space-x-2">
              {AVATARS.map((src, index) => (
                <div
                  key={src}
                  className="relative size-9 overflow-hidden rounded-full border-2 border-[#06040f] transition-transform duration-200 hover:z-10 hover:scale-110"
                  style={{ zIndex: AVATARS.length - index }}
                >
                  <Image src={src} alt="" fill className="object-cover" sizes="36px" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-white/60">
                Trusted by <span className="font-semibold text-white">50,000+</span> fashion
                lovers
              </p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="interactive-card relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-primary/10">
            <Image
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&h=1200&q=80"
              alt="Fashion model in curated outfit"
              fill
              priority
              className="object-cover transition-transform duration-500 hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06040f]/80 via-transparent to-transparent" />
          </div>

          <Link
            href={ROUTES.AI.RECOMMENDATIONS}
            className={cn(
              'interactive-card absolute -right-2 top-8 max-w-[200px] rounded-2xl border border-white/10',
              'bg-[#111827]/90 p-4 backdrop-blur-xl transition-all duration-200 hover:border-emerald-500/30 sm:right-4',
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-xs font-semibold text-emerald-300">AI Match Found</span>
            </div>
            <p className="text-sm font-semibold text-white">Zara Linen Blazer</p>
            <p className="mt-1 text-xs text-emerald-400">Match score: 96%</p>
          </Link>

          <Link
            href={ROUTES.AI.FASHION_DNA}
            className={cn(
              'interactive-card absolute -left-2 bottom-12 max-w-[210px] rounded-2xl border border-white/10',
              'bg-[#111827]/90 p-4 backdrop-blur-xl transition-all duration-200 hover:border-primary/30 sm:left-4',
            )}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Sparkles className="size-4" />
              </span>
              <span className="text-sm font-bold text-white">Fashion DNA</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Style Type</span>
                <span className="font-semibold text-white">Minimalist</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Confidence</span>
                <span className="font-semibold text-white">85/100</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Top Color</span>
                <span className="font-semibold text-white">Navy</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
