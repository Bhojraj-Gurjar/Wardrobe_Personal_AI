'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { APP_NAME } from '@/constants/app';
import { ROUTES } from '@/constants/routes';
import { LANDING_NAV } from '@/features/landing/constants/landing-content';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export function LandingNavbar({ className }) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-white/5 bg-[#06040f]/90 backdrop-blur-xl',
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href={ROUTES.HOME}
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 transition-transform duration-200 group-hover:scale-105">
            <Sparkles className="size-4 text-primary-foreground" />
          </span>
          <span className="text-sm font-bold tracking-[0.18em] text-white">
            {APP_NAME.toUpperCase()}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LANDING_NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-white/60 transition-all duration-200 hover:text-white hover:underline hover:underline-offset-4"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.AUTH.LOGIN}
            className="hidden text-sm font-medium text-white/80 transition-colors duration-200 hover:text-white sm:inline"
          >
            Sign in
          </Link>
          <Button
            asChild
            className="rounded-full bg-primary px-5 shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-[1.03] hover:bg-primary/90 hover:shadow-primary/40"
          >
            <Link href={ROUTES.AUTH.REGISTER}>Start for Free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
