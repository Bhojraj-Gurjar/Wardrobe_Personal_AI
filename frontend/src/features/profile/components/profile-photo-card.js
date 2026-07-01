'use client';

import { useState } from 'react';
import { Loader2, UserRound } from 'lucide-react';
import { FacePhotoCaptureDialog } from '@/features/face/components/face-photo-capture-dialog';
import { useUpdateFacePhotoMutation } from '@/features/face/hooks/use-update-face-photo';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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

export function ProfilePhotoCard({ profile, isLoading }) {
  const authUser = useUserProfile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const updatePhotoMutation = useUpdateFacePhotoMutation();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Profile Photo</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Skeleton className="size-28 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayName = profile?.name || 'Your account';
  const displayEmail = profile?.email || authUser?.email || '';
  const faceImageUrl = withCacheBust(
    profile?.faceImageUrl,
    profile?.updated_at || profile?.face_image_url,
  );
  const canChangePhoto = profile?.is_face_registered;

  const handleSubmit = async (file) => {
    setErrorMessage('');

    try {
      await updatePhotoMutation.mutateAsync(file);
      setDialogOpen(false);
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to update profile photo.');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Current Profile Photo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-dashboard-muted/10">
            {faceImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={faceImageUrl}
                alt={`${displayName} profile`}
                className="size-full object-cover"
              />
            ) : (
              <UserRound className="size-12 text-dashboard-muted" aria-hidden="true" />
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-lg font-semibold text-dashboard-foreground">{displayName}</p>
              {displayEmail ? (
                <p className="text-sm text-dashboard-muted">{displayEmail}</p>
              ) : null}
            </div>

            {canChangePhoto ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setErrorMessage('');
                  setDialogOpen(true);
                }}
                disabled={updatePhotoMutation.isPending}
              >
                {updatePhotoMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  'Change Photo'
                )}
              </Button>
            ) : (
              <p className="text-sm text-dashboard-muted">
                Register your face during onboarding to enable profile photo updates.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <FacePhotoCaptureDialog
        open={dialogOpen}
        title="Change profile photo"
        description="Capture or upload a new front-facing photo. Your face embedding will be regenerated."
        submitLabel="Update photo"
        isSubmitting={updatePhotoMutation.isPending}
        errorMessage={errorMessage}
        onClose={() => {
          if (!updatePhotoMutation.isPending) {
            setDialogOpen(false);
          }
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
}
