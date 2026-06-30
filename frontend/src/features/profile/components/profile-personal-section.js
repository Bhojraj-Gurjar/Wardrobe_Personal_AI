'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { personalInfoSchema } from '@/features/profile/schemas';
import { GENDER_OPTIONS } from '@/features/profile/constants/profile-options';
import {
  buildProfilePatch,
  joinName,
  mergePreferences,
  splitName,
} from '@/features/profile/utils/profile-helpers';
import {
  useProfileQuery,
  useUpdateProfileMutation,
} from '@/features/profile/hooks';
import {
  ProfileDetailCard,
  ProfileDetailRow,
  ProfileSaveFooter,
  PROFILE_DETAIL_FIELD_CLASS,
  PROFILE_DETAIL_SELECT_CLASS,
} from '@/features/profile/components/profile-detail-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/utils/cn';

export function ProfilePersonalSection({ sectionRef }) {
  const { data: profile } = useProfileQuery();
  const updateMutation = useUpdateProfileMutation();
  const preferencesSnapshot = useMemo(
    () => JSON.stringify(profile?.preferences ?? null),
    [profile?.preferences],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      gender: '',
      age: '',
      date_of_birth: '',
      occupation: '',
      city: '',
      country: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (!profile) return;

    const { firstName, lastName } = splitName(profile.name);
    const preferences = profile.preferences || {};

    reset({
      first_name: firstName,
      last_name: lastName,
      email: profile.email || '',
      phone: preferences.phone || '',
      gender: profile.gender || '',
      age: profile.age ?? '',
      date_of_birth: preferences.date_of_birth || '',
      occupation: preferences.occupation_label || preferences.occupation || '',
      city: preferences.city || '',
      country: profile.country || '',
      bio: preferences.bio || '',
    });
  }, [profile?.id, profile?.updated_at, preferencesSnapshot, reset]);

  const onSubmit = (values) => {
    const preferences = profile?.preferences || {};
    const name = joinName(values.first_name, values.last_name);
    const nextPreferences = mergePreferences(preferences, {
      phone: values.phone || undefined,
      date_of_birth: values.date_of_birth || undefined,
      occupation_label: values.occupation || undefined,
      city: values.city || undefined,
      bio: values.bio || undefined,
    });

    updateMutation.mutate(buildProfilePatch({
      name: name || undefined,
      gender: values.gender || undefined,
      age: values.age !== '' ? Number(values.age) : undefined,
      country: values.country || undefined,
      preferences: nextPreferences,
    }));
  };

  return (
    <div ref={sectionRef}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ProfileDetailCard
          title="Personal Information"
          footer={
            <ProfileSaveFooter>
              {updateMutation.isError ? (
                <Alert variant="destructive" className="flex-1">
                  <AlertDescription>
                    {updateMutation.error?.message || 'Unable to save profile.'}
                  </AlertDescription>
                </Alert>
              ) : updateMutation.isSuccess ? (
                <Alert className="flex-1 border-primary/20 bg-primary/5">
                  <AlertDescription>Personal information saved.</AlertDescription>
                </Alert>
              ) : (
                <div className="flex-1" />
              )}

              <Button
                type="submit"
                className="rounded-xl px-6"
                disabled={updateMutation.isPending || !isDirty}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </ProfileSaveFooter>
          }
        >
          <ProfileDetailRow label="First Name">
            <Input
              id="first_name"
              aria-invalid={Boolean(errors.first_name)}
              className={PROFILE_DETAIL_FIELD_CLASS}
              {...register('first_name')}
            />
          </ProfileDetailRow>

          <ProfileDetailRow label="Last Name">
            <Input
              id="last_name"
              aria-invalid={Boolean(errors.last_name)}
              className={PROFILE_DETAIL_FIELD_CLASS}
              {...register('last_name')}
            />
          </ProfileDetailRow>

          <ProfileDetailRow label="Email">
            <Input
              id="email"
              readOnly
              disabled
              className={cn(PROFILE_DETAIL_FIELD_CLASS, 'text-dashboard-muted')}
              {...register('email')}
            />
          </ProfileDetailRow>

          <ProfileDetailRow label="Phone">
            <Input
              id="phone"
              aria-invalid={Boolean(errors.phone)}
              className={PROFILE_DETAIL_FIELD_CLASS}
              placeholder="Add phone"
              {...register('phone')}
            />
          </ProfileDetailRow>

          <ProfileDetailRow label="Gender">
            <select
              id="gender"
              aria-invalid={Boolean(errors.gender)}
              className={PROFILE_DETAIL_SELECT_CLASS}
              {...register('gender')}
            >
              <option value="">Select…</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </ProfileDetailRow>

          <ProfileDetailRow label="Age">
            <Input
              id="age"
              type="number"
              min={13}
              max={120}
              aria-invalid={Boolean(errors.age)}
              className={PROFILE_DETAIL_FIELD_CLASS}
              placeholder="—"
              {...register('age')}
            />
          </ProfileDetailRow>

          <ProfileDetailRow label="Date of Birth">
            <Input
              id="date_of_birth"
              type="date"
              aria-invalid={Boolean(errors.date_of_birth)}
              className={PROFILE_DETAIL_FIELD_CLASS}
              {...register('date_of_birth')}
            />
          </ProfileDetailRow>

          <ProfileDetailRow label="Occupation">
            <Input
              id="occupation"
              aria-invalid={Boolean(errors.occupation)}
              className={PROFILE_DETAIL_FIELD_CLASS}
              placeholder="Add occupation"
              {...register('occupation')}
            />
          </ProfileDetailRow>

          <ProfileDetailRow label="Location">
            <Input
              id="city"
              aria-invalid={Boolean(errors.city)}
              className={PROFILE_DETAIL_FIELD_CLASS}
              placeholder="City"
              {...register('city')}
            />
          </ProfileDetailRow>

          <ProfileDetailRow label="Country">
            <Input
              id="country"
              aria-invalid={Boolean(errors.country)}
              className={PROFILE_DETAIL_FIELD_CLASS}
              placeholder="Add country"
              {...register('country')}
            />
          </ProfileDetailRow>

          <ProfileDetailRow label="Bio" className="items-start">
            <textarea
              id="bio"
              rows={2}
              aria-invalid={Boolean(errors.bio)}
              className={cn(
                PROFILE_DETAIL_FIELD_CLASS,
                'max-h-20 min-h-[3rem] resize-none py-1 leading-relaxed',
              )}
              placeholder="Tell us about your style"
              {...register('bio')}
            />
          </ProfileDetailRow>
        </ProfileDetailCard>
      </form>
    </div>
  );
}
