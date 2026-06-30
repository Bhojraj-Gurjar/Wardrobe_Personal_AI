'use client';

import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function WelcomeBanner() {
  const showWelcome = useOnboardingStore((state) => state.showWelcome);
  const clearWelcome = useOnboardingStore((state) => state.clearWelcome);

  useEffect(() => {
    if (!showWelcome) return undefined;

    const timer = setTimeout(() => clearWelcome(), 8000);
    return () => clearTimeout(timer);
  }, [showWelcome, clearWelcome]);

  if (!showWelcome) return null;

  return (
    <Alert className="border-primary/30 bg-primary/10">
      <Sparkles className="size-4 text-primary" aria-hidden="true" />
      <AlertDescription className="text-foreground">
        Welcome to Wardrobe AI — your profile is ready. Explore personalized
        recommendations on your dashboard.
      </AlertDescription>
    </Alert>
  );
}
