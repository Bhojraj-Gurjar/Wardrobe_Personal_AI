import { AuthGuard } from '@/features/auth/components';
import {
  OnboardingLayout,
  OnboardingStepGuard,
  StylePreferenceCard,
} from '@/features/onboarding/components';

export const metadata = {
  title: 'Style Preferences',
};

export default function OnboardingStylePage() {
  return (
    <AuthGuard>
      <OnboardingStepGuard requirePersonalDetails requireLifestyle>
        <OnboardingLayout
          stepIndex={2}
          title="Style Preferences"
          subtitle="Teach Wardrobe AI your fashion taste."
        >
          <StylePreferenceCard />
        </OnboardingLayout>
      </OnboardingStepGuard>
    </AuthGuard>
  );
}
