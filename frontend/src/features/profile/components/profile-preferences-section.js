'use client';

import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import {
  BUDGET_OPTIONS,
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  BRAND_OPTIONS,
  INFLUENCER_OPTIONS,
  OCCUPATION_OPTIONS,
  SHOPPING_FREQUENCY_OPTIONS,
  STYLE_INSPIRATION_OPTIONS,
  OUTFIT_TYPE_OPTIONS,
} from '@/features/onboarding/constants/onboarding-options';
import { SelectionChipGroup } from '@/features/onboarding/components/selection-chip';
import {
  buildPreferencesUpdate,
  preferencesToLifestyleStyle,
} from '@/features/profile/utils/profile-helpers';
import {
  useProfileQuery,
  useUpdateProfileMutation,
} from '@/features/profile/hooks';
import {
  ProfileDetailCard,
  ProfileFieldGroup,
  ProfileSaveFooter,
} from '@/features/profile/components/profile-detail-card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ProfilePreferencesSection() {
  const { data: profile } = useProfileQuery();
  const updateMutation = useUpdateProfileMutation();
  const preferencesSnapshot = useMemo(
    () => JSON.stringify(profile?.preferences ?? null),
    [profile?.preferences],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({
    defaultValues: {
      occupation: '',
      shopping_frequency: '',
      budget_preference: '',
      preferred_categories: [],
      favorite_colors: [],
      favorite_brands: [],
      fashion_influencers: [],
      style_inspiration: [],
      preferred_outfit_types: [],
    },
  });

  useEffect(() => {
    if (!profile) return;

    const { lifestyle, style } = preferencesToLifestyleStyle(profile.preferences || {});

    reset({
      occupation: lifestyle.occupation,
      shopping_frequency: lifestyle.shopping_frequency,
      budget_preference: lifestyle.budget_preference,
      preferred_categories: lifestyle.preferred_categories,
      favorite_colors: style.favorite_colors,
      favorite_brands: style.favorite_brands,
      fashion_influencers: style.fashion_influencers,
      style_inspiration: style.style_inspiration,
      preferred_outfit_types: style.preferred_outfit_types,
    });
  }, [profile?.id, profile?.updated_at, preferencesSnapshot, reset]);

  const onSubmit = (values) => {
    const preferences = profile?.preferences || {};
    const nextPreferences = buildPreferencesUpdate(
      preferences,
      {
        occupation: values.occupation,
        shopping_frequency: values.shopping_frequency,
        budget_preference: values.budget_preference,
        preferred_categories: values.preferred_categories,
      },
      {
        favorite_colors: values.favorite_colors,
        favorite_brands: values.favorite_brands,
        fashion_influencers: values.fashion_influencers,
        style_inspiration: values.style_inspiration,
        preferred_outfit_types: values.preferred_outfit_types,
      },
    );

    updateMutation.mutate({ preferences: nextPreferences });
  };

  return (
    <ProfileDetailCard
      title="Style & Lifestyle Preferences"
      description="Tell us how you shop and what you love — we use this to personalize recommendations."
      divided={false}
      contentClassName="mt-5 space-y-2"
      footer={
        <ProfileSaveFooter>
          {updateMutation.isSuccess ? (
            <Alert className="flex-1 border-primary/20 bg-primary/5">
              <AlertDescription>Preferences saved successfully.</AlertDescription>
            </Alert>
          ) : (
            <div className="flex-1" />
          )}
          <Button
            type="submit"
            form="profile-preferences-form"
            className="rounded-xl px-6"
            disabled={updateMutation.isPending || !isDirty}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save preferences'
            )}
          </Button>
        </ProfileSaveFooter>
      }
    >
      <form id="profile-preferences-form" onSubmit={handleSubmit(onSubmit)} className="space-y-1">
        <ProfileFieldGroup
          title="Lifestyle"
          description="How you live and shop day to day"
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
        </ProfileFieldGroup>

        <ProfileFieldGroup title="Shopping frequency">
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
        </ProfileFieldGroup>

        <ProfileFieldGroup title="Budget range">
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
        </ProfileFieldGroup>

        <ProfileFieldGroup
          title="Occasion preferences"
          hint="Select all that apply"
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
        </ProfileFieldGroup>

        <div className="border-t border-white/[0.06] pt-2">
          <p className="pb-4 text-xs font-semibold uppercase tracking-wider text-primary/80">
            Style preferences
          </p>

          <ProfileFieldGroup title="Favorite colors" hint="Select all that apply">
            <Controller
              name="favorite_colors"
              control={control}
              render={({ field }) => (
                <SelectionChipGroup
                  options={COLOR_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  multiple
                  columns={4}
                />
              )}
            />
          </ProfileFieldGroup>

          <ProfileFieldGroup title="Favorite brands" hint="Select all that apply">
            <Controller
              name="favorite_brands"
              control={control}
              render={({ field }) => (
                <SelectionChipGroup
                  options={BRAND_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  multiple
                  columns={3}
                />
              )}
            />
          </ProfileFieldGroup>

          <ProfileFieldGroup title="Style inspiration" hint="People or aesthetics you follow">
            <Controller
              name="fashion_influencers"
              control={control}
              render={({ field }) => (
                <SelectionChipGroup
                  options={INFLUENCER_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  multiple
                  columns={2}
                />
              )}
            />
          </ProfileFieldGroup>

          <ProfileFieldGroup title="Preferred outfit types" hint="Select all that apply">
            <Controller
              name="preferred_outfit_types"
              control={control}
              render={({ field }) => (
                <SelectionChipGroup
                  options={OUTFIT_TYPE_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  multiple
                  columns={2}
                />
              )}
            />
          </ProfileFieldGroup>

          <ProfileFieldGroup title="Additional inspiration">
            <Controller
              name="style_inspiration"
              control={control}
              render={({ field }) => (
                <SelectionChipGroup
                  options={STYLE_INSPIRATION_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  multiple
                  columns={2}
                />
              )}
            />
          </ProfileFieldGroup>
        </div>
      </form>
    </ProfileDetailCard>
  );
}
