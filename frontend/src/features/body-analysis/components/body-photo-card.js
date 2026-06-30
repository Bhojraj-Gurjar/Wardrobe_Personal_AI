'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { StudioBodyPhoto } from './studio-body-photo';
import { BodyUploadPanel } from './body-upload-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { BODY_DASHBOARD_CARD_CLASS } from '../constants/body-analysis-dashboard';

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

export function BodyPhotoCard({
  bodyImageUrl,
  imageVersion,
  bodyType,
  summaryRows,
  hasBodyPhoto,
  hasReport,
  scanButtonLabel,
  emptyMessage,
  isAnalyzing,
  onAnalyze,
  analyzeExistingOnClick = false,
  errorMessage,
  className,
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [localError, setLocalError] = useState('');
  const resolvedImageUrl = withCacheBust(bodyImageUrl, imageVersion);
  const displayError = errorMessage || localError;

  const handleAnalyzeExisting = async () => {
    setLocalError('');

    try {
      await onAnalyze?.();
    } catch (error) {
      setLocalError(error?.message || 'Body analysis failed. Please try again.');
    }
  };

  const handleFileSelected = async (file) => {
    setLocalError('');

    try {
      await onAnalyze?.(file);
      setUploadOpen(false);
    } catch (error) {
      setLocalError(error?.message || 'Body analysis failed. Please try again.');
    }
  };

  return (
    <>
      <Card className={cn(BODY_DASHBOARD_CARD_CLASS, 'overflow-hidden', className)}>
        <CardContent className="flex h-full flex-col p-6">
          <p className="text-center text-[11px] font-semibold tracking-[0.28em] text-[#A78BFA]">
            CURRENT BODY PHOTO
          </p>

          <div className="my-5 flex justify-center">
            <StudioBodyPhoto
              src={resolvedImageUrl}
              alt="Current body photo"
              className="w-full max-w-[220px] border-2 border-[#8B5CF6]/35 shadow-lg shadow-[#8B5CF6]/10"
              fallback={(
                <p className="text-xs text-dashboard-muted">{emptyMessage}</p>
              )}
            />
          </div>

          {bodyType && bodyType !== '—' && hasReport ? (
            <div className="mb-4 flex justify-center">
              <Badge
                className={cn(
                  'rounded-full border border-[#8B5CF6]/40 bg-[#8B5CF6]/20',
                  'px-4 py-1.5 text-sm font-medium text-[#DDD6FE]',
                )}
              >
                {bodyType}
              </Badge>
            </div>
          ) : (
            <div className="mb-4 h-8" />
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

              setUploadOpen(true);
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

      <BodyUploadPanel
        open={uploadOpen}
        onClose={() => {
          if (!isAnalyzing) {
            setUploadOpen(false);
            setLocalError('');
          }
        }}
        onFileSelected={handleFileSelected}
        isBusy={isAnalyzing}
        errorMessage={localError}
      />
    </>
  );
}
