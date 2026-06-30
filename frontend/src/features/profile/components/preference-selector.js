'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Briefcase,
  Building2,
  ChevronDown,
  GraduationCap,
  Laptop,
  Loader2,
  Palette,
  Shirt,
  Sparkles,
} from 'lucide-react';
import {
  BUDGET_OPTIONS,
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  BRAND_OPTIONS,
  INFLUENCER_OPTIONS,
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
import { ProfilePremiumCard } from '@/features/profile/components/profile-premium-card';
import { ProfileMotionGridItem } from '@/features/profile/components/profile-motion';
import { ProfileSaveFooter } from '@/features/profile/components/profile-detail-card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/utils/cn';

const OCCUPATION_CARDS = [
  {
    value: 'STUDENT',
    label: 'Student',
    description: 'Campus-ready style on a smart budget',
    icon: GraduationCap,
  },
  {
    value: 'EMPLOYEE',
    label: 'Employee',
    description: 'Polished looks for work and after hours',
    icon: Briefcase,
  },
  {
    value: 'FREELANCER',
    label: 'Freelancer',
    description: 'Flexible style across meetings and moods',
    icon: Laptop,
  },
  {
    value: 'BUSINESS_OWNER',
    label: 'Business Owner',
    description: 'Confident presence in every room',
    icon: Building2,
  },
];

function LifestyleCard({ option, selected, onSelect }) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10',
        selected
          ? 'border-primary/50 bg-primary/10 shadow-[0_0_24px_rgba(124,58,237,0.2)]'
          : 'border-white/[0.08] bg-white/[0.03] hover:border-primary/30',
      )}
    >
      <div
        className={cn(
          'mb-3 flex size-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
          selected ? 'bg-primary/25 text-primary' : 'bg-white/5 text-dashboard-muted',
        )}
      >
        <Icon className="size-5" />
      </div>
      <p className="text-sm font-semibold text-dashboard-foreground">{option.label}</p>
      <p className="mt-1 text-xs leading-relaxed text-dashboard-muted">{option.description}</p>
    </button>
  );
}

function PreferenceGroup({ title, hint, children, icon: Icon }) {
  return (
    <div className="space-y-3 border-t border-white/[0.06] pt-5 first:border-0 first:pt-0">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="size-4 text-primary" /> : null}
        <div>
          <h3 className="text-sm font-semibold text-dashboard-foreground">{title}</h3>
          {hint ? <p className="text-xs text-dashboard-muted">{hint}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export function PreferenceSelector() {
  const [showDetails, setShowDetails] = useState(false);
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
    watch,
    setValue,
    register,
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

  const occupation = watch('occupation');

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
    <ProfilePremiumCard
      title="Account Information"
      icon={Sparkles}
      action={
        <button
          type="button"
          onClick={() => setShowDetails((open) => !open)}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2',
            'text-xs font-medium text-dashboard-foreground transition-colors hover:bg-white/10',
          )}
          aria-expanded={showDetails}
        >
          {showDetails ? 'Hide details' : 'Show details'}
          <ChevronDown
            className={cn('size-4 transition-transform duration-300', showDetails && 'rotate-180')}
          />
        </button>
      }
    >
      <div
        className={cn(
          'grid transition-all duration-500 ease-out',
          showDetails ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <form
            id="profile-preferences-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 pt-2"
          >
            <p className="text-sm text-dashboard-muted">
              Tell us how you live and shop — we personalize every recommendation
            </p>
        <PreferenceGroup title="Lifestyle" hint="How you spend your days">
          <div className="grid gap-3 sm:grid-cols-2">
            {OCCUPATION_CARDS.map((option, index) => (
              <ProfileMotionGridItem key={option.value} index={index}>
                <LifestyleCard
                  option={option}
                  selected={occupation === option.value}
                  onSelect={(value) => setValue('occupation', value, { shouldDirty: true })}
                />
              </ProfileMotionGridItem>
            ))}
          </div>
          <input type="hidden" {...register('occupation')} />
        </PreferenceGroup>

        <PreferenceGroup title="Shopping frequency">
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
        </PreferenceGroup>

        <PreferenceGroup title="Budget range">
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
        </PreferenceGroup>

        <PreferenceGroup
          title="Fashion Preferences"
          hint="Categories, colors, brands, and occasions you love"
          icon={Shirt}
        >
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-medium text-dashboard-muted">Favorite categories</p>
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
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-dashboard-muted">Preferred occasions</p>
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
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-dashboard-muted">
                <Palette className="size-3.5" />
                Favorite colors
              </p>
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
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-dashboard-muted">Favorite brands</p>
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
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-dashboard-muted">Style inspiration</p>
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
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-dashboard-muted">Additional inspiration</p>
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
            </div>
          </div>
        </PreferenceGroup>

        <ProfileSaveFooter className="border-t border-white/[0.06] pt-5">
          {updateMutation.isSuccess ? (
            <Alert className="flex-1 border-primary/20 bg-primary/5">
              <AlertDescription>Preferences saved successfully.</AlertDescription>
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
              'Save preferences'
            )}
          </Button>
        </ProfileSaveFooter>
          </form>
        </div>
      </div>

      {!showDetails ? (
        <p className="text-sm text-dashboard-muted">
          Lifestyle, shopping habits, budget, and fashion preferences are tucked away here. Expand
          when you want to review or update them.
        </p>
      ) : null}
    </ProfilePremiumCard>
  );
}
