'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ScanFace } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ScanAgainCaptureFlow } from '@/components/shared/scan-again-capture-flow';
import {
  useAnalyzeFaceMutation,
  useFaceAnalysisQuery,
} from '@/features/face-analysis/hooks';
import { mergeFaceAnalysisDashboard } from '@/features/face-analysis/utils/merge-face-analysis-dashboard';
import { ProfileDetailCard } from '@/features/profile/components/profile-detail-card';
import {
  ProfileMediaPreview,
  ProfileTraitGrid,
} from '@/features/profile/components/profile-trait-grid';
import { withCacheBust } from '@/features/profile/utils/profile-helpers';
import { Button } from '@/components/ui/button';

export function ProfileFaceSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { data, isLoading } = useFaceAnalysisQuery();
  const analyzeMutation = useAnalyzeFaceMutation();
  const dashboard = mergeFaceAnalysisDashboard(data);

  const faceImageUrl = withCacheBust(
    dashboard.faceImageUrl || data?.faceImageUrl,
    data?.analyzedAt || data?.updated_at,
  );

  const handleSubmit = async (file) => {
    setErrorMessage('');
    try {
      await analyzeMutation.mutateAsync(file);
      setDialogOpen(false);
    } catch (error) {
      setErrorMessage(error?.message || 'Face analysis failed.');
    }
  };

  const traits = [
    { label: 'Face Shape', value: dashboard.summaryRows?.[0]?.value },
    { label: 'Skin Tone', value: dashboard.summaryRows?.[1]?.value },
    { label: 'Hair Type', value: dashboard.summaryRows?.[2]?.value },
    { label: 'Beard Style', value: dashboard.summaryRows?.[3]?.value },
    {
      label: 'Confidence',
      value: dashboard.overallConfidence != null ? `${dashboard.overallConfidence}%` : null,
    },
  ].filter((item) => item.value && item.value !== '—');

  return (
    <>
      <ProfileDetailCard
        title="Face Analysis"
        description="Your registered face photo and AI trait analysis."
        divided={false}
        contentClassName="mt-5"
        action={
          <Button variant="ghost" size="sm" asChild className="text-primary">
            <Link href={ROUTES.FACE.ANALYSIS}>Open full view</Link>
          </Button>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[11rem_1fr] lg:items-start">
          <ProfileMediaPreview
            src={faceImageUrl}
            alt="Face analysis"
            fallbackIcon={ScanFace}
          />

          <div className="space-y-4">
            <ProfileTraitGrid
              items={traits}
              isLoading={isLoading}
              loadingMessage="Loading face analysis…"
              emptyMessage="No face analysis yet. Scan or upload a photo to generate traits."
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
                ) : (
                  <ScanFace className="size-4" />
                )}
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
                Upload New Photo
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
        sourceSubtitle="Select how you want to perform your face analysis."
        captureTitle="Update face photo"
        captureDescription="A new scan refreshes face analysis, profile photo, and Fashion DNA."
        captureSubmitLabel="Analyze face"
      />
    </>
  );
}
