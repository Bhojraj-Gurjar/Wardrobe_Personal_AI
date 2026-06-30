import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { APP_NAME } from '@/constants/app';

const HERO_IMAGE = '/images/login-hero.jpg';

export function LoginHero() {
  return (
    <div className="relative hidden min-h-screen overflow-hidden lg:block">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        className="object-cover"
        sizes="60vw"
      />
      <div
        className="absolute inset-0 bg-navy/55"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-navy/40"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
            <Sparkles className="size-5 text-primary-foreground" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-auth-panel-foreground">
            {APP_NAME}
          </span>
        </div>

        <div className="max-w-lg space-y-4 pb-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-auth-panel-foreground xl:text-5xl">
            Your personal{' '}
            <span className="text-auth-highlight">AI fashion</span> assistant
          </h1>
          <p className="text-base leading-relaxed text-auth-panel-muted xl:text-lg">
            Get AI-powered style recommendations curated to your unique Fashion
            DNA.
          </p>
        </div>
      </div>
    </div>
  );
}
