'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Sparkles } from 'lucide-react';
import {
  useAnalyzeBodyMutation,
  useAnalyzeCurrentBodyMutation,
  useBodyAnalysisQuery,
} from '@/features/body-analysis/hooks';
import { useProfileQuery } from '@/features/profile/hooks/use-profile';
import { mergeBodyAnalysisDashboard } from '@/features/body-analysis/utils/merge-body-analysis-dashboard';
import { MEASUREMENT_ROWS } from '@/features/body-analysis/constants/body-analysis-dashboard';
import { validateFullBodyImage } from '@/features/body-analysis/utils/validate-full-body-image.util';
import { BodyPhotoCard } from './body-photo-card';
import { BodyMeasurementsCard } from './body-measurements-card';
import { PersonalizedFitGuide } from './personalized-fit-guide';
import { BodyAnalysisSkeleton } from './body-analysis-skeleton';
import { BodyAnalysisProgressOverlay } from './body-analysis-progress-overlay';

const BodyProportionsRadar = dynamic(
  () => import('./body-proportions-radar').then((mod) => mod.BodyProportionsRadar),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-[460px] animate-pulse rounded-[24px] bg-dashboard-surface" />
    ),
  },
);

function buildOrderedMeasurements(measurements = {}) {
  return MEASUREMENT_ROWS.map((row) => ({
    label: row.label,
    cm: measurements[row.key]?.cm ?? null,
    inches: measurements[row.key]?.inches ?? null,
  }));
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function BodyAnalysisView() {
  const [errorMessage, setErrorMessage] = useState('');
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressPhase, setProgressPhase] = useState('validating');
  const [progressSuccess, setProgressSuccess] = useState(false);
  const autoAnalyzeAttempted = useRef(false);
  const successTimerRef = useRef(null);
  const { data: profile } = useProfileQuery();
  const { data, isLoading, isError } = useBodyAnalysisQuery();
  const analyzeMutation = useAnalyzeBodyMutation();
  const analyzeCurrentMutation = useAnalyzeCurrentBodyMutation();

  const dashboard = mergeBodyAnalysisDashboard(isError ? null : data, profile);

  const isAnalyzing = analyzeMutation.isPending
    || analyzeCurrentMutation.isPending
    || progressOpen;

  const clearSuccessTimer = useCallback(() => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearSuccessTimer(), [clearSuccessTimer]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!dashboard.hasBodyPhoto || dashboard.hasAnalysis) {
      return;
    }

    if (autoAnalyzeAttempted.current || isAnalyzing) {
      return;
    }

    autoAnalyzeAttempted.current = true;
    analyzeCurrentMutation.mutate(undefined, {
      onError: (error) => {
        setErrorMessage(error?.message || 'Body analysis failed. Please try again.');
      },
    });
  }, [
    analyzeCurrentMutation,
    dashboard.hasAnalysis,
    dashboard.hasBodyPhoto,
    isAnalyzing,
    isLoading,
  ]);

  if (isLoading) {
    return <BodyAnalysisSkeleton />;
  }

  const orderedMeasurements = buildOrderedMeasurements(dashboard.measurements);

  const runProgressSequence = async (mutationPromise) => {
        setProgressPhase('uploading');
        await sleep(350);
        setProgressPhase('detecting');
        await sleep(350);
        setProgressPhase('analyzing');
        await sleep(350);
        setProgressPhase('extracting');

    const result = await mutationPromise;

    setProgressPhase('generating');
    await sleep(400);
    setProgressPhase('updating');
    await sleep(350);

    return result;
  };

  const handleAnalyze = async (file) => {
    setErrorMessage('');
    clearSuccessTimer();

    try {
      if (file) {
        setProgressOpen(true);
        setProgressSuccess(false);
        setProgressPhase('validating');

        const validation = await validateFullBodyImage(file);
        if (!validation.ok) {
          setProgressOpen(false);
          const message = validation.error || 'Full body not detected. Please upload a clear full-body photo with your entire body, including both feet, visible.';
          setErrorMessage(message);
          throw new Error(message);
        }

        await runProgressSequence(
          analyzeMutation.mutateAsync({
            imageFile: file,
            height: profile?.height ?? data?.height ?? undefined,
          }),
        );

        setProgressSuccess(true);
        successTimerRef.current = setTimeout(() => {
          setProgressOpen(false);
          setProgressSuccess(false);
        }, 2800);

        return;
      }

      await analyzeCurrentMutation.mutateAsync();
    } catch (error) {
      setProgressOpen(false);
      setProgressSuccess(false);
      const message = error?.message || 'Body analysis failed. Please try again.';
      setErrorMessage(message);
      throw new Error(message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <BodyAnalysisProgressOverlay
        open={progressOpen}
        phase={progressPhase}
        success={progressSuccess}
      />

      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#8B5CF6]">
          <Sparkles className="size-3.5" aria-hidden="true" />
          AI MEASUREMENTS
        </p>
        <h2 className="text-3xl font-bold text-dashboard-foreground">
          Body Analysis
        </h2>
        <p className="text-sm text-dashboard-muted">
          {dashboard.lastUpdatedLabel}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <BodyPhotoCard
          bodyImageUrl={dashboard.bodyImageUrl}
          imageVersion={data?.updatedAt || data?.body_image_url}
          bodyType={dashboard.bodyType}
          summaryRows={dashboard.photoSummaryRows}
          hasBodyPhoto={dashboard.hasBodyPhoto}
          hasReport={dashboard.hasReport}
          scanButtonLabel={dashboard.scanButtonLabel}
          emptyMessage={dashboard.emptyPhotoMessage}
          isAnalyzing={isAnalyzing}
          analyzeExistingOnClick={dashboard.hasBodyPhoto && !dashboard.hasReport}
          onAnalyze={handleAnalyze}
          errorMessage={errorMessage}
          className="xl:min-h-[460px]"
        />
        <BodyMeasurementsCard
          rows={orderedMeasurements}
          hasAnalysis={dashboard.hasAnalysis}
          sizeRecommendations={dashboard.sizeRecommendations}
          className="xl:min-h-[460px]"
        />
        <BodyProportionsRadar
          radarData={dashboard.radarData}
          hasAnalysis={dashboard.hasAnalysis}
          className="xl:min-h-[460px]"
        />
      </div>

      <PersonalizedFitGuide fitGuide={dashboard.fitGuide} hasAnalysis={dashboard.hasAnalysis} />
    </div>
  );
}
