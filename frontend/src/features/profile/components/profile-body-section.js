'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ScanAgainCaptureFlow } from '@/components/shared/scan-again-capture-flow';
import {
  useAnalyzeBodyMutation,
  useBodyAnalysisQuery,
} from '@/features/body-analysis/hooks';
import { mergeBodyAnalysisDashboard } from '@/features/body-analysis/utils/merge-body-analysis-dashboard';
import { useProfileQuery } from '@/features/profile/hooks';
import { ProfileDetailCard } from '@/features/profile/components/profile-detail-card';
import { ProfileTraitGrid } from '@/features/profile/components/profile-trait-grid';
import { StudioBodyPhoto } from '@/features/body-analysis/components/studio-body-photo';
import { withCacheBust } from '@/features/profile/utils/profile-helpers';
import { Button } from '@/components/ui/button';

export function ProfileBodySection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { data: profile } = useProfileQuery();
  const { data, isLoading } = useBodyAnalysisQuery();
  const analyzeMutation = useAnalyzeBodyMutation();
  const dashboard = mergeBodyAnalysisDashboard(data);

  const bodyImageUrl = withCacheBust(
    dashboard.bodyImageUrl,
    data?.updated_at || data?.analyzedAt,
  );

  const measurements = [
    { label: 'Body Type', value: dashboard.bodyTypeLabel },
    { label: 'Height', value: dashboard.measurementRows?.find((r) => r.label === 'Height')?.value },
    { label: 'Shoulders', value: dashboard.measurementRows?.find((r) => r.label === 'Shoulder Width')?.value },
    { label: 'Chest', value: dashboard.measurementRows?.find((r) => r.label === 'Chest')?.value },
    { label: 'Waist', value: dashboard.measurementRows?.find((r) => r.label === 'Waist')?.value },
    { label: 'Hip', value: dashboard.measurementRows?.find((r) => r.label === 'Hip')?.value },
    { label: 'Arm', value: dashboard.measurementRows?.find((r) => r.label === 'Arm Length')?.value },
    { label: 'Inseam', value: dashboard.measurementRows?.find((r) => r.label === 'Leg Length')?.value },
  ].filter((item) => item.value && item.value !== '—');

  const handleSubmit = async (file) => {
    setErrorMessage('');
    try {
      await analyzeMutation.mutateAsync({
        imageFile: file,
        height: profile?.height,
      });
      setDialogOpen(false);
    } catch (error) {
      setErrorMessage(error?.message || 'Body analysis failed.');
    }
  };

  return (
    <>
      <ProfileDetailCard
        title="Body Analysis"
        description="Saved body photo and AI fit measurements."
        divided={false}
        contentClassName="mt-5"
        action={
          <Button variant="ghost" size="sm" asChild className="text-primary">
            <Link href={ROUTES.BODY.ANALYSIS}>Open full view</Link>
          </Button>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[11rem_1fr] lg:items-start">
          <StudioBodyPhoto
            src={bodyImageUrl}
            alt="Body analysis"
            className="mx-auto w-44 shrink-0 lg:mx-0"
            aspectClassName="aspect-[3/4]"
          />

          <div className="space-y-4">
            <ProfileTraitGrid
              items={measurements}
              isLoading={isLoading}
              loadingMessage="Loading body analysis…"
              emptyMessage="No body analysis yet. Scan or upload a full-body photo."
            />

            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                type="button"
                className="rounded-xl"
                disabled={analyzeMutation.isPending}
                onClick={() => {
                  setErrorMessage('');
                  setDialogOpen(true);
                }}
              >
                {analyzeMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Scan Again
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-primary/40 text-primary"
                disabled={analyzeMutation.isPending}
                onClick={() => {
                  setErrorMessage('');
                  setDialogOpen(true);
                }}
              >
                Upload New Body Photo
              </Button>
            </div>
          </div>
        </div>
      </ProfileDetailCard>

      <ScanAgainCaptureFlow
        open={dialogOpen}
        onClose={() => {
          if (!analyzeMutation.isPending) setDialogOpen(false);
        }}
        onSubmit={handleSubmit}
        isSubmitting={analyzeMutation.isPending}
        errorMessage={errorMessage}
        sourceTitle="Choose Image Source"
        sourceSubtitle="Select how you want to perform your body analysis."
        captureTitle="Update body photo"
        captureDescription="Upload a full-body photo to refresh body analysis, Fashion DNA, and avatar fit data."
        captureSubmitLabel="Analyze body"
      />
    </>
  );
}
