'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { updateProfileSchema } from '@/features/profile/schemas';
import {
  BODY_TYPE_OPTIONS,
  GENDER_OPTIONS,
  SKIN_TONE_OPTIONS,
} from '@/features/profile/constants/profile-options';
import {
  useProfileQuery,
  useUpdateProfileMutation,
} from '@/features/profile/hooks';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectField as UiSelectField } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorState } from '@/components/shared/error-state';
import { Skeleton } from '@/components/ui/skeleton';

function SelectField({ id, options, error, ...props }) {
  return (
    <UiSelectField
      id={id}
      aria-invalid={Boolean(error)}
      {...props}
    >
      <option value="">Select…</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </UiSelectField>
  );
}

export function ProfileForm() {
  const { data: profile, isLoading, isError, error, refetch } = useProfileQuery();
  const updateMutation = useUpdateProfileMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      gender: '',
      age: '',
      height: '',
      weight: '',
      body_type: '',
      skin_tone: '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        gender: profile.gender || '',
        age: profile.age ?? '',
        height: profile.height ?? '',
        weight: profile.weight ?? '',
        body_type: profile.body_type || '',
        skin_tone: profile.skin_tone || '',
      });
    }
  }, [profile, reset]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load profile"
        description={error?.message}
        onRetry={refetch}
      />
    );
  }

  const onSubmit = (values) => {
    const payload = {};

    if (values.gender) payload.gender = values.gender;
    if (values.age !== '') payload.age = Number(values.age);
    if (values.height !== '') payload.height = Number(values.height);
    if (values.weight !== '') payload.weight = Number(values.weight);
    if (values.body_type) payload.body_type = values.body_type;
    if (values.skin_tone) payload.skin_tone = values.skin_tone;

    updateMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="gender" label="Gender" error={errors.gender?.message}>
          <SelectField
            id="gender"
            options={GENDER_OPTIONS}
            error={errors.gender?.message}
            {...register('gender')}
          />
        </FormField>

        <FormField
          id="age"
          label="Age"
          hint="13–120"
          error={errors.age?.message}
        >
          <Input
            id="age"
            type="number"
            min={13}
            max={120}
            {...register('age')}
          />
        </FormField>

        <FormField
          id="height"
          label="Height (cm)"
          hint="50–300"
          error={errors.height?.message}
        >
          <Input
            id="height"
            type="number"
            min={50}
            max={300}
            {...register('height')}
          />
        </FormField>

        <FormField
          id="weight"
          label="Weight (kg)"
          hint="20–500"
          error={errors.weight?.message}
        >
          <Input
            id="weight"
            type="number"
            min={20}
            max={500}
            {...register('weight')}
          />
        </FormField>

        <FormField
          id="body_type"
          label="Body type"
          error={errors.body_type?.message}
        >
          <SelectField
            id="body_type"
            options={BODY_TYPE_OPTIONS}
            error={errors.body_type?.message}
            {...register('body_type')}
          />
        </FormField>

        <FormField
          id="skin_tone"
          label="Skin tone"
          error={errors.skin_tone?.message}
        >
          <SelectField
            id="skin_tone"
            options={SKIN_TONE_OPTIONS}
            error={errors.skin_tone?.message}
            {...register('skin_tone')}
          />
        </FormField>
      </div>

      {updateMutation.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {updateMutation.error?.message || 'Unable to save profile.'}
          </AlertDescription>
        </Alert>
      ) : null}

      {updateMutation.isSuccess ? (
        <Alert>
          <AlertDescription>Profile updated successfully.</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={updateMutation.isPending || !isDirty}>
        {updateMutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : (
          'Save profile'
        )}
      </Button>
    </form>
  );
}
