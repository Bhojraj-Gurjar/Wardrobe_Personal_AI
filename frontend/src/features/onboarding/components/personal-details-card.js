'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ROUTES } from '@/constants/routes';
import {
  GENDER_OPTIONS,
  BODY_TYPE_OPTIONS,
} from '@/features/onboarding/constants/onboarding-options';
import {
  personalDetailsSchema,
  toPersonalDetailsPayload,
} from '@/features/onboarding/schemas/onboarding.schema';
import { useOnboardingProfileMutation } from '@/features/onboarding/hooks/use-onboarding-mutations';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useBodyCaptureStore } from '@/stores/body-capture-store';
import { runBodyAnalysis } from '@/features/body-analysis/utils/run-body-analysis';
import { useAuthStore } from '@/stores/auth-store';
import { GenderCardGroup } from '@/features/onboarding/components/gender-card';
import {
  OnboardingField,
  OnboardingInput,
  OnboardingSelect,
  OnboardingSubmitButton,
} from '@/features/onboarding/components/onboarding-field';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function PersonalDetailsCard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const savedDetails = useOnboardingStore((state) => state.personalDetails);
  const setPersonalDetails = useOnboardingStore((state) => state.setPersonalDetails);
  const setBodyImageFile = useBodyCaptureStore((state) => state.setBodyImageFile);
  const bodyImageFile = useBodyCaptureStore((state) => state.bodyImageFile);
  const updateProfile = useOnboardingProfileMutation();

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: savedDetails || {
      name: '',
      gender: 'PREFER_NOT_TO_SAY',
      age: '',
      height: '',
      weight: '',
      country: '',
      language: 'English',
      body_type: '',
      skin_tone: '',
    },
  });

  const onSubmit = useCallback(
    (values) => {
      const payload = toPersonalDetailsPayload(values);
      setPersonalDetails(payload);
      router.push(ROUTES.ONBOARDING.LIFESTYLE);
      updateProfile.mutate(payload);
    },
    [router, setPersonalDetails, updateProfile],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <OnboardingField
        id="name"
        label="Name"
        required
        error={errors.name?.message}
      >
        <OnboardingInput
          id="name"
          placeholder="Your full name"
          {...register('name')}
        />
      </OnboardingField>

      <OnboardingField
        id="gender"
        label="Gender"
        required
        error={errors.gender?.message}
      >
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <GenderCardGroup
              options={GENDER_OPTIONS}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </OnboardingField>

      <div className="grid gap-4 sm:grid-cols-3">
        <OnboardingField id="age" label="Age" required error={errors.age?.message}>
          <OnboardingInput
            id="age"
            type="number"
            inputMode="numeric"
            placeholder="25"
            {...register('age')}
          />
        </OnboardingField>
        <OnboardingField
          id="height"
          label="Height (cm)"
          required
          error={errors.height?.message}
        >
          <OnboardingInput
            id="height"
            type="number"
            inputMode="decimal"
            placeholder="170"
            {...register('height')}
          />
        </OnboardingField>
        <OnboardingField
          id="weight"
          label="Weight (kg)"
          required
          error={errors.weight?.message}
        >
          <OnboardingInput
            id="weight"
            type="number"
            inputMode="decimal"
            placeholder="65"
            {...register('weight')}
          />
        </OnboardingField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <OnboardingField
          id="country"
          label="Country"
          required
          error={errors.country?.message}
        >
          <OnboardingInput
            id="country"
            placeholder="India"
            {...register('country')}
          />
        </OnboardingField>
        <OnboardingField
          id="language"
          label="Language"
          required
          error={errors.language?.message}
        >
          <OnboardingInput
            id="language"
            placeholder="English"
            {...register('language')}
          />
        </OnboardingField>
      </div>

      <OnboardingField
        id="body_type"
        label="Body Type"
        hint="Optional — improves fit recommendations"
        error={errors.body_type?.message}
      >
        <OnboardingSelect id="body_type" {...register('body_type')}>
          <option value="">Select body type</option>
          {BODY_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </OnboardingSelect>
      </OnboardingField>

      <OnboardingField
        id="body_photo"
        label="Full-body photo"
        hint="Optional — body analysis runs automatically after upload"
      >
        <OnboardingInput
          id="body_photo"
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0] || null;
            setBodyImageFile(file);
            event.target.value = '';

            if (!file) {
              return;
            }

            const heightValue = getValues('height');
            const height = heightValue !== '' ? Number(heightValue) : null;

            runBodyAnalysis({
              token: useAuthStore.getState().accessToken,
              queryClient,
              imageFile: file,
              height: Number.isFinite(height) && height > 0 ? height : undefined,
            }).catch(() => {});
          }}
        />
        {bodyImageFile ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Selected: {bodyImageFile.name}
          </p>
        ) : null}
      </OnboardingField>

      {updateProfile.isError ? (
        <Alert
          variant="destructive"
          className="border-destructive/40 bg-destructive/10"
        >
          <AlertDescription>
            {updateProfile.error?.message || 'Unable to save profile details.'}
          </AlertDescription>
        </Alert>
      ) : null}

      <OnboardingSubmitButton disabled={updateProfile.isPending}>
        Continue
      </OnboardingSubmitButton>
    </form>
  );
}
