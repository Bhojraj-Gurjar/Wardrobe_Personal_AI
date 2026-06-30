'use client';

import { useRef, useState } from 'react';
import { AccountSettings } from '@/features/profile/components/account-settings';
import { AIInsightsPanel } from '@/features/profile/components/ai-insights-panel';
import { FashionIdentityCard } from '@/features/profile/components/fashion-identity-card';
import { FashionJourney } from '@/features/profile/components/fashion-journey';
import { PersonalizationHealth } from '@/features/profile/components/personalization-health';
import { PreferenceSelector } from '@/features/profile/components/preference-selector';
import { ProfileHero } from '@/features/profile/components/profile-hero';
import { ProfileMotionSection } from '@/features/profile/components/profile-motion';
import { WardrobeStats } from '@/features/profile/components/wardrobe-stats';
import { useProfileDashboard } from '@/features/profile/hooks/use-profile-dashboard';
import { ErrorState } from '@/components/shared/error-state';

export function ProfileView() {
  const accountSectionRef = useRef(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const dashboard = useProfileDashboard();

  if (dashboard.isError) {
    return (
      <ErrorState
        title="Could not load profile"
        description={dashboard.error?.message || 'Something went wrong.'}
        onRetry={dashboard.refetch}
      />
    );
  }

  const scrollToAccount = () => {
    setAccountOpen(true);
    requestAnimationFrame(() => {
      accountSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <ProfileMotionSection delay={0}>
        <ProfileHero
          profile={dashboard.profile}
          stylePersonality={dashboard.stylePersonality}
          fashionDnaScore={dashboard.fashionIdentity?.fashionDnaScore}
          memberSince={dashboard.memberSince}
          completionPercent={dashboard.completion?.percent ?? 0}
          isLoading={dashboard.isLoading}
          onEditProfile={scrollToAccount}
        />
      </ProfileMotionSection>

      <ProfileMotionSection delay={0.05}>
        <div className="grid gap-6 xl:grid-cols-2">
          <FashionIdentityCard
            identity={dashboard.fashionIdentity}
            isLoading={dashboard.isLoading}
          />
          <AIInsightsPanel
            insights={dashboard.fashionDna?.aiInsights}
            isLoading={dashboard.isLoading}
          />
        </div>
      </ProfileMotionSection>

      <ProfileMotionSection delay={0.1}>
        <PreferenceSelector />
      </ProfileMotionSection>

      <ProfileMotionSection delay={0.12}>
        <WardrobeStats stats={dashboard.wardrobeStats} isLoading={dashboard.isLoading} />
      </ProfileMotionSection>

      <ProfileMotionSection delay={0.14}>
        <div className="grid gap-6 xl:grid-cols-2">
          <FashionJourney events={dashboard.fashionJourney} isLoading={dashboard.isLoading} />
          <PersonalizationHealth
            items={dashboard.personalizationHealth}
            isLoading={dashboard.isLoading}
          />
        </div>
      </ProfileMotionSection>

      <ProfileMotionSection delay={0.16} id="account-settings">
        <AccountSettings
          sectionRef={accountSectionRef}
          open={accountOpen}
          onOpenChange={setAccountOpen}
        />
      </ProfileMotionSection>
    </div>
  );
}
