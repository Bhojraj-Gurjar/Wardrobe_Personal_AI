'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, UserRound } from 'lucide-react';
import { ScanAgainCaptureFlow } from '@/components/shared/scan-again-capture-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { FACE_DASHBOARD_CARD_CLASS } from '../constants/face-analysis-dashboard';

function withCacheBust(url, version) {
  if (!url) {
    return null;
  }

  if (!version) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

export function FaceScanCard({
  summaryRows,
  showAnalyzedBadge,
  scanButtonLabel,
  faceImageUrl,
  imageVersion,
  isAnalyzing,
  onAnalyze,
  analyzeExistingOnClick = false,
  errorMessage,
  className,
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [localError, setLocalError] = useState('');
  const resolvedImageUrl = withCacheBust(faceImageUrl, imageVersion);

  const handleAnalyzeExisting = async () => {
    setLocalError('');

    try {
      await onAnalyze?.();
    } catch (error) {
      setLocalError(error?.message || 'Face analysis failed. Please try again.');
    }
  };

  const handleSubmit = async (file, meta = {}) => {
    setLocalError('');

    try {
      await onAnalyze?.(file, meta);
      setDialogOpen(false);
    } catch (error) {
      setLocalError(error?.message || 'Face analysis failed. Please try again.');
    }
  };

  const displayError = errorMessage || localError;

  return (
    <>
      <Card className={cn(FACE_DASHBOARD_CARD_CLASS, 'overflow-hidden', className)}>
        <CardContent className="flex h-full flex-col p-6">
          <p className="text-center text-[11px] font-semibold tracking-[0.28em] text-[#A78BFA]">
            {resolvedImageUrl ? 'CURRENT FACE' : 'FACE SCAN'}
          </p>

          <div className="my-6 flex justify-center">
            {resolvedImageUrl ? (
              <div className="size-44 overflow-hidden rounded-full border-2 border-[#8B5CF6]/40 bg-black/20 shadow-lg shadow-[#8B5CF6]/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolvedImageUrl}
                  alt="Registered face"
                  className="size-full object-cover"
                />
              </div>
            ) : (
              <div className="flex size-44 items-center justify-center rounded-full border border-dashed border-[#8B5CF6]/30 bg-[#8B5CF6]/5">
                <UserRound className="size-16 text-[#A78BFA]/70" aria-hidden="true" />
              </div>
            )}
          </div>

          {showAnalyzedBadge ? (
            <div className="mb-6 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/15 px-4 py-1.5 text-sm font-medium text-[#DDD6FE]">
                <CheckCircle2 className="size-4 text-[#8B5CF6]" />
                Analyzed
              </span>
            </div>
          ) : (
            <div className="mb-6 h-8" />
          )}

          <div className="space-y-3 border-t border-white/8 pt-5">
            {summaryRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-dashboard-muted">{row.label}</span>
                <span className="font-medium text-dashboard-foreground">{row.value}</span>
              </div>
            ))}
          </div>

          {displayError ? (
            <p className="mt-4 text-sm text-red-400">{displayError}</p>
          ) : null}

          <Button
            type="button"
            disabled={isAnalyzing}
            onClick={() => {
              setLocalError('');

              if (analyzeExistingOnClick) {
                handleAnalyzeExisting();
                return;
              }

              setDialogOpen(true);
            }}
            className="mt-6 h-12 w-full rounded-2xl bg-[#8B5CF6] text-white hover:bg-[#7C3AED]"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Analyzing
              </>
            ) : (
              scanButtonLabel
            )}
          </Button>
        </CardContent>
      </Card>

      <ScanAgainCaptureFlow
        open={dialogOpen}
        onClose={() => {
          if (!isAnalyzing) {
            setDialogOpen(false);
          }
        }}
        onSubmit={handleSubmit}
        isSubmitting={isAnalyzing}
        errorMessage={localError}
        sourceTitle="Choose Image Source"
        sourceSubtitle="Select how you want to perform your face analysis."
        captureTitle={showAnalyzedBadge ? 'Scan face again' : 'Analyze your face'}
        captureDescription="Capture a clear front-facing photo in good lighting."
        captureSubmitLabel={showAnalyzedBadge ? 'Scan again' : 'Analyze face'}
      />
    </>
  );
}
