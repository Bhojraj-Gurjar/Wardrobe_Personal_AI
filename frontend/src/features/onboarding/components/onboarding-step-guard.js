'use client';



import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { ROUTES } from '@/constants/routes';

import { useOnboardingStore } from '@/stores/onboarding-store';



export function OnboardingStepGuard({

  requirePersonalDetails,

  requireLifestyle,

  children,

}) {

  const router = useRouter();

  const personalDetails = useOnboardingStore((state) => state.personalDetails);

  const lifestyle = useOnboardingStore((state) => state.lifestyle);

  const completed = useOnboardingStore((state) => state.completed);



  const shouldRedirectToDashboard = completed;

  const shouldRedirectToProfile = requirePersonalDetails && !personalDetails;

  const shouldRedirectToLifestyle = requireLifestyle && !lifestyle;

  const isRedirecting =

    shouldRedirectToDashboard ||

    shouldRedirectToProfile ||

    shouldRedirectToLifestyle;



  useEffect(() => {

    if (shouldRedirectToDashboard) {

      router.replace(ROUTES.DASHBOARD.HOME);

      return;

    }



    if (shouldRedirectToProfile) {

      router.replace(ROUTES.ONBOARDING.PROFILE);

      return;

    }



    if (shouldRedirectToLifestyle) {

      router.replace(ROUTES.ONBOARDING.LIFESTYLE);

    }

  }, [

    router,

    shouldRedirectToDashboard,

    shouldRedirectToLifestyle,

    shouldRedirectToProfile,

  ]);



  if (isRedirecting) {

    return null;

  }



  return children;

}

