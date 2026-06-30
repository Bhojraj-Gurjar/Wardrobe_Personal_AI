'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ROUTES } from '@/constants/routes';
import {
  COLOR_OPTIONS,
  BRAND_OPTIONS,
  INFLUENCER_OPTIONS,
  STYLE_INSPIRATION_OPTIONS,
  OUTFIT_TYPE_OPTIONS,
} from '@/features/onboarding/constants/onboarding-options';
import { styleSurveySchema } from '@/features/onboarding/schemas/onboarding.schema';
import { useCompleteOnboardingMutation } from '@/features/onboarding/hooks/use-onboarding-mutations';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { usePrefetchDashboardQueries } from '@/hooks/use-prefetch-app-data';
import { SelectionChipGroup } from '@/features/onboarding/components/selection-chip';
import {
  OnboardingField,
  OnboardingSubmitButton,
} from '@/features/onboarding/components/onboarding-field';
import { Alert, AlertDescription } from '@/components/ui/alert';

const colorOptions = COLOR_OPTIONS.map((color) => ({
  value: color,
  label: color,
}));

const brandOptions = BRAND_OPTIONS.map((brand) => ({
  value: brand,
  label: brand,
}));

const influencerOptions = INFLUENCER_OPTIONS.map((item) => ({
  value: item,
  label: item,
}));

const inspirationOptions = STYLE_INSPIRATION_OPTIONS.map((item) => ({
  value: item,
  label: item,
}));

const outfitOptions = OUTFIT_TYPE_OPTIONS.map((item) => ({
  value: item,
  label: item,
}));

export function StylePreferenceCard() {
  const router = useRouter();
  const savedStyle = useOnboardingStore((state) => state.style);
  const completeOnboarding = useCompleteOnboardingMutation();
  usePrefetchDashboardQueries(true);

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(styleSurveySchema),
    defaultValues: savedStyle || {
      favorite_colors: [],
      favorite_brands: [],
      fashion_influencers: [],
      style_inspiration: [],
      preferred_outfit_types: [],
    },
  });

  const onSubmit = useCallback(
    (values) => {
      completeOnboarding.mutate(values, {
        onSuccess: () => router.push(ROUTES.DASHBOARD.HOME),
      });
    },
    [completeOnboarding, router],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>
      <OnboardingField
        id="favorite_colors"
        label="Favorite Colors"
        hint="Select all that apply"
        required
        error={errors.favorite_colors?.message}
      >
        <Controller
          name="favorite_colors"
          control={control}
          render={({ field }) => (
            <SelectionChipGroup
              options={colorOptions}
              value={field.value}
              onChange={field.onChange}
              multiple
              columns={4}
            />
          )}
        />
      </OnboardingField>

      <OnboardingField
        id="favorite_brands"
        label="Favorite Brands"
        hint="Select all that apply"
        required
        error={errors.favorite_brands?.message}
      >
        <Controller
          name="favorite_brands"
          control={control}
          render={({ field }) => (
            <SelectionChipGroup
              options={brandOptions}
              value={field.value}
              onChange={field.onChange}
              multiple
              columns={2}
            />
          )}
        />
      </OnboardingField>

      <OnboardingField
        id="fashion_influencers"
        label="Fashion Influencers"
        hint="Select all that apply"
        required
        error={errors.fashion_influencers?.message}
      >
        <Controller
          name="fashion_influencers"
          control={control}
          render={({ field }) => (
            <SelectionChipGroup
              options={influencerOptions}
              value={field.value}
              onChange={field.onChange}
              multiple
              columns={2}
            />
          )}
        />
      </OnboardingField>

      <OnboardingField
        id="style_inspiration"
        label="Style Inspiration"
        hint="Select all that apply"
        error={errors.style_inspiration?.message}
      >
        <Controller
          name="style_inspiration"
          control={control}
          render={({ field }) => (
            <SelectionChipGroup
              options={inspirationOptions}
              value={field.value || []}
              onChange={field.onChange}
              multiple
              columns={2}
            />
          )}
        />
      </OnboardingField>

      <OnboardingField
        id="preferred_outfit_types"
        label="Preferred Outfit Types"
        hint="Select all that apply"
        error={errors.preferred_outfit_types?.message}
      >
        <Controller
          name="preferred_outfit_types"
          control={control}
          render={({ field }) => (
            <SelectionChipGroup
              options={outfitOptions}
              value={field.value || []}
              onChange={field.onChange}
              multiple
              columns={2}
            />
          )}
        />
      </OnboardingField>

      {completeOnboarding.isError ? (
        <Alert
          variant="destructive"
          className="border-destructive/40 bg-destructive/10"
        >
          <AlertDescription>
            {completeOnboarding.error?.message ||
              'Unable to complete onboarding.'}
          </AlertDescription>
        </Alert>
      ) : null}

      <OnboardingSubmitButton
        isLoading={completeOnboarding.isPending}
        loadingLabel="Finishing setup…"
      >
        Complete onboarding
      </OnboardingSubmitButton>
    </form>
  );
}
