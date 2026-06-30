import Image from 'next/image';
import { ScanFace, Shirt, Sparkles } from 'lucide-react';
import { APP_NAME } from '@/constants/app';

const HERO_IMAGE = '/images/login-hero.jpg';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Recommendations',
    description: 'Outfits tailored to your style, body type, and preferences.',
  },
  {
    icon: Shirt,
    title: 'Smart Wardrobe',
    description: 'Browse curated products matched to your Fashion DNA profile.',
  },
  {
    icon: ScanFace,
    title: 'Face Auth',
    description: 'Secure, passwordless sign-in with facial recognition.',
  },
];

export function AuthHero() {
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

        <ul className="max-w-lg space-y-5">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;

            return (
              <li key={feature.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 shadow-sm">
                  <Icon className="size-5 text-auth-panel-foreground" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-medium text-auth-panel-foreground">{feature.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-auth-panel-muted">
                    {feature.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="max-w-lg space-y-4 pb-6">
          <p className="text-sm font-medium uppercase tracking-widest text-auth-panel-muted">
            Welcome to
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-auth-panel-foreground xl:text-5xl">
            Wardrobe{' '}
            <span className="text-auth-highlight">AI</span>
          </h1>
          <p className="text-base leading-relaxed text-auth-panel-muted xl:text-lg">
            Personalized fashion powered by AI. Build your profile, discover
            outfits, and shop with confidence.
          </p>
        </div>
      </div>
    </div>
  );
}
