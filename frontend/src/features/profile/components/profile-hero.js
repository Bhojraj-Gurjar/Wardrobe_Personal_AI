'use client';

import { useState } from 'react';
import {
  Camera,
  Crown,
  Dna,
  Loader2,
  Pencil,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { FacePhotoCaptureDialog } from '@/features/face/components/face-photo-capture-dialog';
import { useUpdateFacePhotoMutation } from '@/features/face/hooks/use-update-face-photo';
import {
  ProfilePremiumCard,
  ProfileProgressRing,
} from '@/features/profile/components/profile-premium-card';
import { AnimatedProgressBar } from '@/features/profile/components/profile-motion';
import { formatEnumLabel, withCacheBust, resolveProfileImageUrl } from '@/features/profile/utils/profile-helpers';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export function ProfileHero({
  profile,
  stylePersonality,
  fashionDnaScore,
  memberSince,
  completionPercent,
  isLoading,
  onEditProfile,
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const updatePhotoMutation = useUpdateFacePhotoMutation();

  if (isLoading) {
    return (
      <ProfilePremiumCard variant="hero" className="animate-pulse">
        <div className="flex flex-col items-center gap-6 lg:flex-row">
          <div className="size-28 rounded-2xl bg-white/5" />
          <div className="flex-1 space-y-3">
            <div className="mx-auto h-8 w-48 rounded-lg bg-white/5 lg:mx-0" />
            <div className="mx-auto h-4 w-64 rounded bg-white/5 lg:mx-0" />
            <div className="mx-auto h-4 w-40 rounded bg-white/5 lg:mx-0" />
          </div>
        </div>
      </ProfilePremiumCard>
    );
  }

  const displayName = profile?.name || 'Your Profile';
  const faceImageUrl = withCacheBust(
    resolveProfileImageUrl(profile?.faceImageUrl),
    profile?.updated_at,
  );
  const planLabel = profile?.plan || 'Premium Member';
  const hasPhoto = Boolean(faceImageUrl);

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
      <ProfilePremiumCard variant="hero">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <div
                className={cn(
                  'flex size-28 items-center justify-center overflow-hidden rounded-2xl sm:size-32',
                  'border-2 border-white/10 bg-white/5 shadow-[0_8px_32px_rgba(109,40,217,0.25)]',
                )}
              >
                {faceImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={faceImageUrl}
                    alt={`${displayName} profile`}
                    className="size-full object-cover"
                  />
                ) : (
                  <UserRound className="size-14 text-white/35" />
                )}
              </div>

              <span
                className={cn(
                  'absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium',
                  hasPhoto
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300',
                )}
              >
                {hasPhoto ? 'Photo active' : 'Add photo'}
              </span>

              <button
                type="button"
                className={cn(
                  'absolute -bottom-1 -right-1 flex size-9 items-center justify-center rounded-full',
                  'border-2 border-[#12121f] bg-primary text-white shadow-lg transition-transform hover:scale-105',
                )}
                aria-label="Change profile photo"
                disabled={updatePhotoMutation.isPending}
                onClick={() => {
                  setErrorMessage('');
                  setDialogOpen(true);
                }}
              >
                {updatePhotoMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
              </button>
            </div>

            <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {displayName}
                </h1>
                {stylePersonality ? (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-[#c4b5fd]">
                    <Sparkles className="size-3.5" />
                    {stylePersonality}
                  </p>
                ) : (
                  <p className="mt-1.5 text-sm text-white/50">
                    Complete your style profile to unlock your fashion identity
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-[#c4b5fd]">
                  <Crown className="size-3.5 fill-[#a78bfa] text-[#a78bfa]" />
                  {planLabel}
                </span>
                {fashionDnaScore ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
                    <Dna className="size-3.5 text-primary" />
                    Fashion DNA: {fashionDnaScore}
                  </span>
                ) : null}
                {memberSince ? (
                  <span className="text-xs text-white/45">Member since {memberSince}</span>
                ) : null}
              </div>

              <div className="max-w-md space-y-2 pt-1">
                <div className="flex items-center justify-between gap-3 text-xs text-white/55 sm:justify-start">
                  <span>Profile Completion</span>
                  <span className="font-semibold text-white">{completionPercent}%</span>
                </div>
                <AnimatedProgressBar
                  percent={completionPercent}
                  barClassName="h-2 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa]"
                />
              </div>
            </div>

            <div className="relative hidden shrink-0 sm:block">
              <div className="relative flex size-16 items-center justify-center">
                <ProfileProgressRing percent={completionPercent} size={64} strokeWidth={5} />
                <span className="absolute text-sm font-bold text-white">
                  {completionPercent}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap justify-center gap-3 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className={cn(
                'rounded-full border border-white/15 bg-white/5 px-5',
                'text-sm font-medium text-white hover:bg-white/10 hover:text-white',
              )}
              onClick={onEditProfile}
            >
              <Pencil className="size-4" />
              Edit Profile
            </Button>
            <Button
              type="button"
              className="rounded-full px-5"
              disabled={updatePhotoMutation.isPending}
              onClick={() => {
                setErrorMessage('');
                setDialogOpen(true);
              }}
            >
              <Camera className="size-4" />
              Change Photo
            </Button>
          </div>
        </div>
      </ProfilePremiumCard>

      <FacePhotoCaptureDialog
        open={dialogOpen}
        title="Update profile photo"
        description="Capture or upload a new front-facing photo. Face analysis and Fashion DNA will refresh automatically."
        submitLabel="Update photo"
        isSubmitting={updatePhotoMutation.isPending}
        errorMessage={errorMessage}
        onClose={() => {
          if (!updatePhotoMutation.isPending) setDialogOpen(false);
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
}
