'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  useAnalyzeCurrentFaceMutation,
  useAnalyzeFaceMutation,
  useFaceAnalysisQuery,
} from '@/features/face-analysis/hooks';

import { mergeFaceAnalysisDashboard } from '@/features/face-analysis/utils/merge-face-analysis-dashboard';

import { FACE_PAGE_BACKGROUND } from '@/features/face-analysis/constants/face-analysis-dashboard';

import { FaceScanCard } from './face-scan-card';

import { FaceTraitAnalysisCard } from './face-trait-analysis-card';

import { FaceStyleInsightsSection } from './face-style-insights-section';

import { FaceAnalysisSkeleton } from './face-analysis-skeleton';



export function FaceAnalysisView() {
  const [errorMessage, setErrorMessage] = useState('');
  const autoAnalyzeAttempted = useRef(false);
  const { data, isLoading } = useFaceAnalysisQuery();
  const analyzeMutation = useAnalyzeFaceMutation();
  const analyzeCurrentMutation = useAnalyzeCurrentFaceMutation();

  const isAnalyzing = analyzeMutation.isPending
    || analyzeCurrentMutation.isPending;

  useEffect(() => {
    if (
      isLoading
      || !data?.is_face_registered
      || !data?.faceImageUrl
      || data?.hasAnalysis
    ) {
      return;
    }

    if (autoAnalyzeAttempted.current || isAnalyzing) {
      return;
    }

    autoAnalyzeAttempted.current = true;
    analyzeCurrentMutation.mutate(undefined, {
      onError: (error) => {
        setErrorMessage(
          error?.message
          || 'Face analysis failed. Please upload a new photo and try again.',
        );
      },
    });
  }, [
    analyzeCurrentMutation,
    data?.faceImageUrl,
    data?.hasAnalysis,
    data?.is_face_registered,
    isAnalyzing,
    isLoading,
  ]);



  if (isLoading) {

    return <FaceAnalysisSkeleton />;

  }



  const dashboard = mergeFaceAnalysisDashboard(data);

  const missingPhotoHint = data?.facePhotoMissing
    ? 'Your previous face photo was removed during a server update. Upload a new photo to analyze your face.'
    : '';



  const handleAnalyze = async (file, meta = {}) => {
    setErrorMessage('');

    try {
      if (file) {
        await analyzeMutation.mutateAsync({
          file,
          captureSource: meta.source || 'upload',
        });
        return;
      }

      await analyzeCurrentMutation.mutateAsync();
    } catch (error) {
      const message = error?.message || 'Face analysis failed. Please try again.';
      setErrorMessage(message);
      throw new Error(message);
    }
  };



  const isPageAnalyzing = analyzeMutation.isPending || analyzeCurrentMutation.isPending;

  if (isPageAnalyzing) {

    return <FaceAnalysisSkeleton />;

  }



  return (

    <div

      className="mx-auto max-w-7xl space-y-6"

      style={{ backgroundColor: FACE_PAGE_BACKGROUND }}

    >

      <div className="space-y-2">

        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#8B5CF6]">

          <Sparkles className="size-3.5" aria-hidden="true" />

          AI ANALYSIS

        </p>

        <h2 className="text-3xl font-bold text-dashboard-foreground">Face Analysis</h2>

        <p className="text-sm text-dashboard-muted">{dashboard.subtitle}</p>

      </div>



      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">

        <FaceScanCard

          summaryRows={dashboard.summaryRows}

          showAnalyzedBadge={dashboard.showAnalyzedBadge}

          scanButtonLabel={dashboard.scanButtonLabel}

          faceImageUrl={dashboard.faceImageUrl}

          imageVersion={data?.analyzedAt || data?.updatedAt || data?.face_image_url}

          isAnalyzing={isAnalyzing}

          analyzeExistingOnClick={dashboard.hasFacePhoto && !dashboard.hasReport}

          onAnalyze={handleAnalyze}

          errorMessage={errorMessage || missingPhotoHint}

          className="lg:min-h-[520px]"

        />



        <div className="grid gap-4 sm:grid-cols-2 xl:col-span-2">

          {dashboard.analysisCards.map((card) => (

            <FaceTraitAnalysisCard

              key={card.id}

              title={card.title}

              value={card.value}

              description={card.description}

              confidence={card.confidence}

              progressClass={card.progressClass}

              icon={card.icon}

              iconClass={card.iconClass}

              swatch={card.swatch}

              hasReport={dashboard.hasReport}

            />

          ))}

        </div>

      </div>



      {dashboard.styleInsights?.sections?.length ? (
        <FaceStyleInsightsSection styleInsights={dashboard.styleInsights} />
      ) : null}

    </div>

  );

}


