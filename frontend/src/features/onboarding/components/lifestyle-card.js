'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ROUTES } from '@/constants/routes';
import {
  OCCUPATION_OPTIONS,
  SHOPPING_FREQUENCY_OPTIONS,
  BUDGET_OPTIONS,
  CATEGORY_OPTIONS,
} from '@/features/onboarding/constants/onboarding-options';
import { lifestyleSchema } from '@/features/onboarding/schemas/onboarding.schema';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { SelectionChipGroup } from '@/features/onboarding/components/selection-chip';
import {
  OnboardingField,
  OnboardingSubmitButton,
} from '@/features/onboarding/components/onboarding-field';

export function LifestyleCard() {
  const router = useRouter();
  const savedLifestyle = useOnboardingStore((state) => state.lifestyle);
  const setLifestyle = useOnboardingStore((state) => state.setLifestyle);

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(lifestyleSchema),
    defaultValues: savedLifestyle || {
      occupation: 'EMPLOYEE',
      shopping_frequency: 'MONTHLY',
      budget_preference: 'MID_RANGE',
      preferred_categories: [],
    },
  });

  const onSubmit = useCallback(
    (values) => {
      setLifestyle(values);
      router.push(ROUTES.ONBOARDING.STYLE);
    },
    [router, setLifestyle],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>
      <OnboardingField
        id="occupation"
        label="Occupation"
        required
        error={errors.occupation?.message}
      >
        <Controller
          name="occupation"
          control={control}
          render={({ field }) => (
            <SelectionChipGroup
              options={OCCUPATION_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              columns={2}
            />
          )}
        />
      </OnboardingField>

      <OnboardingField
        id="shopping_frequency"
        label="Shopping Frequency"
        required
        error={errors.shopping_frequency?.message}
      >
        <Controller
          name="shopping_frequency"
          control={control}
          render={({ field }) => (
            <SelectionChipGroup
              options={SHOPPING_FREQUENCY_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              columns={3}
            />
          )}
        />
      </OnboardingField>

      <OnboardingField
        id="budget_preference"
        label="Budget Preference"
        required
        error={errors.budget_preference?.message}
      >
        <Controller
          name="budget_preference"
          control={control}
          render={({ field }) => (
            <SelectionChipGroup
              options={BUDGET_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              columns={2}
            />
          )}
        />
      </OnboardingField>

      <OnboardingField
        id="preferred_categories"
        label="Preferred Categories"
        hint="Select all that apply"
        required
        error={errors.preferred_categories?.message}
      >
        <Controller
          name="preferred_categories"
          control={control}
          render={({ field }) => (
            <SelectionChipGroup
              options={CATEGORY_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              multiple
              columns={3}
            />
          )}
        />
      </OnboardingField>

      <OnboardingSubmitButton>Continue</OnboardingSubmitButton>
    </form>
  );
}
