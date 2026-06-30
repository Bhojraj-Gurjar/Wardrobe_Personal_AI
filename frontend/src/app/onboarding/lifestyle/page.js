import { AuthGuard } from '@/features/auth/components';
import {
  LifestyleCard,
  OnboardingLayout,
  OnboardingStepGuard,
} from '@/features/onboarding/components';

export const metadata = {
  title: 'Lifestyle Preferences',
};

export default function OnboardingLifestylePage() {
  return (
    <AuthGuard>
      <OnboardingStepGuard requirePersonalDetails>
        <OnboardingLayout
          stepIndex={1}
          title="Lifestyle Preferences"
          subtitle="Help us understand your shopping habits."
        >
          <LifestyleCard />
        </OnboardingLayout>
      </OnboardingStepGuard>
    </AuthGuard>
  );
}
