import { LandingNavbar } from '@/features/landing/components/landing-navbar';
import { LandingHero } from '@/features/landing/components/landing-hero';
import { LandingStats } from '@/features/landing/components/landing-stats';
import { LandingFeatures } from '@/features/landing/components/landing-features';
import { LandingProcess } from '@/features/landing/components/landing-process';
import { LandingTestimonials } from '@/features/landing/components/landing-testimonials';
import { LandingPricing, LandingCta } from '@/features/landing/components/landing-pricing';
import { LandingFooter } from '@/features/landing/components/landing-footer';

export function LandingView() {
  return (
    <div className="landing-page min-h-screen bg-[#06040f] text-white">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingStats />
        <LandingFeatures />
        <LandingProcess />
        <LandingTestimonials />
        <LandingPricing />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
