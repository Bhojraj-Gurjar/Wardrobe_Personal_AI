'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import { APP_NAME } from '@/constants/app';
import { ROUTES } from '@/constants/routes';
import { LANDING_FOOTER_LINKS } from '@/features/landing/constants/landing-content';

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 bg-[#06040f]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link
              href={ROUTES.HOME}
              className="group inline-flex items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                <Sparkles className="size-4 text-primary-foreground" />
              </span>
              <span className="text-sm font-bold tracking-[0.18em] text-white">
                {APP_NAME.toUpperCase()}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">
              The premium AI fashion platform that decodes your style and elevates
              every outfit.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs text-white/45">4.9 on App Store</span>
            </div>
          </div>

          <FooterColumn title="Product" links={LANDING_FOOTER_LINKS.product} />
          <FooterColumn title="Company" links={LANDING_FOOTER_LINKS.company} />
          <FooterColumn title="Legal" links={LANDING_FOOTER_LINKS.legal} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <Link
            href={ROUTES.AUTH.REGISTER}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all duration-200 hover:gap-2 hover:text-primary/80"
          >
            Get started free
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/80">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-white/45 transition-colors duration-200 hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
