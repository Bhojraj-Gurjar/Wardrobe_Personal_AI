'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import {
  useBodyAnalysisQuery,
  useUpdateBodyAnalysisMutation,
} from '@/features/body-analysis/hooks';
import { mergeBodyAnalysisDashboard } from '@/features/body-analysis/utils/merge-body-analysis-dashboard';
import { useProfileQuery, useUpdateProfileMutation } from '@/features/profile/hooks';
import {
  ProfileDetailCard,
  ProfileFieldGroup,
  ProfileSaveFooter,
  PROFILE_FORM_INPUT_CLASS,
} from '@/features/profile/components/profile-detail-card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

function readCmValue(dashboard, label) {
  const row = dashboard.measurementRows?.find((item) => item.label === label);
  if (!row?.value || row.value === '—') return '';
  const match = String(row.value).match(/[\d.]+/);
  return match ? match[0] : '';
}

const MEASUREMENT_FIELDS = [
  ['height', 'Height (cm)'],
  ['chest', 'Chest (cm)'],
  ['waist', 'Waist (cm)'],
  ['hip', 'Hip (cm)'],
  ['shoulderWidth', 'Shoulders (cm)'],
  ['legLength', 'Inseam (cm)'],
];

export function ProfileMeasurementsSection() {
  const { data: profile } = useProfileQuery();
  const { data: bodyData } = useBodyAnalysisQuery();
  const bodySnapshot = useMemo(
    () => JSON.stringify(bodyData ?? null),
    [bodyData],
  );
  const updateProfile = useUpdateProfileMutation();
  const updateBody = useUpdateBodyAnalysisMutation();

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm({
    defaultValues: {
      height: '',
      chest: '',
      waist: '',
      hip: '',
      shoulderWidth: '',
      legLength: '',
    },
  });

  useEffect(() => {
    if (!profile && !bodyData) return;

    const merged = mergeBodyAnalysisDashboard(bodyData);

    reset({
      height: profile?.height ?? readCmValue(merged, 'Height'),
      chest: readCmValue(merged, 'Chest'),
      waist: readCmValue(merged, 'Waist'),
      hip: readCmValue(merged, 'Hip'),
      shoulderWidth: readCmValue(merged, 'Shoulder Width'),
      legLength: readCmValue(merged, 'Leg Length'),
    });
  }, [profile?.id, profile?.height, bodySnapshot, reset, bodyData]);

  const onSubmit = async (values) => {
    const height = values.height !== '' ? Number(values.height) : undefined;

    await updateBody.mutateAsync({
      height,
      chest: values.chest !== '' ? Number(values.chest) : undefined,
      waist: values.waist !== '' ? Number(values.waist) : undefined,
      hip: values.hip !== '' ? Number(values.hip) : undefined,
      shoulderWidth: values.shoulderWidth !== '' ? Number(values.shoulderWidth) : undefined,
      legLength: values.legLength !== '' ? Number(values.legLength) : undefined,
    });

    if (height != null) {
      updateProfile.mutate({ height });
    }
  };

  const isSaving = updateBody.isPending || updateProfile.isPending;

  return (
    <ProfileDetailCard
      title="My Measurements"
      description="Manual measurements sync with Body Analysis and fit recommendations."
      divided={false}
      contentClassName="mt-5"
      footer={
        <ProfileSaveFooter>
          {(updateBody.isSuccess || updateProfile.isSuccess) ? (
            <Alert className="flex-1 border-primary/20 bg-primary/5">
              <AlertDescription>Measurements saved and synced.</AlertDescription>
            </Alert>
          ) : (
            <div className="flex-1" />
          )}
          <Button
            type="submit"
            form="profile-measurements-form"
            className="rounded-xl px-6"
            disabled={isSaving || !isDirty}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save measurements'
            )}
          </Button>
        </ProfileSaveFooter>
      }
    >
      <form id="profile-measurements-form" onSubmit={handleSubmit(onSubmit)}>
        <ProfileFieldGroup title="Body measurements" hint="All values in centimeters">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MEASUREMENT_FIELDS.map(([id, label]) => (
              <label key={id} className="space-y-2">
                <span className="text-xs font-medium text-dashboard-muted">{label}</span>
                <input
                  id={id}
                  type="number"
                  min={0}
                  className={PROFILE_FORM_INPUT_CLASS}
                  {...register(id)}
                />
              </label>
            ))}
          </div>
        </ProfileFieldGroup>
      </form>
    </ProfileDetailCard>
  );
}
