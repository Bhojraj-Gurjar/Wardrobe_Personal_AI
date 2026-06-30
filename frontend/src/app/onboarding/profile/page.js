import { AuthGuard } from '@/features/auth/components';
import {
  OnboardingLayout,
  OnboardingStepGuard,
  PersonalDetailsCard,
} from '@/features/onboarding/components';

export const metadata = {
  title: 'Tell us about yourself',
};

export default function OnboardingProfilePage() {
  return (
    <AuthGuard>
      <OnboardingStepGuard>
        <OnboardingLayout
          stepIndex={0}
          title="Tell us about yourself"
          subtitle="Personal details help Wardrobe AI tailor recommendations."
        >
          <PersonalDetailsCard />
        </OnboardingLayout>
      </OnboardingStepGuard>
    </AuthGuard>
  );
}
