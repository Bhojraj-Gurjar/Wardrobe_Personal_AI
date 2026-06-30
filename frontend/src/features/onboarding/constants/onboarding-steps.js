import { ONBOARDING_STEPS } from '@/features/onboarding/constants/onboarding-options';

export { ONBOARDING_STEPS };

export function getStepIndex(pathname) {
  return ONBOARDING_STEPS.findIndex((step) => step.path === pathname);
}
