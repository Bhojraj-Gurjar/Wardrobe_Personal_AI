'use client';

import { useState } from 'react';
import {
  Briefcase,
  Camera,
  Loader2,
  MapPin,
  Pencil,
  Star,
  UserRound,
} from 'lucide-react';
import { FacePhotoCaptureDialog } from '@/features/face/components/face-photo-capture-dialog';
import { useUpdateFacePhotoMutation } from '@/features/face/hooks/use-update-face-photo';
import { formatEnumLabel, withCacheBust, resolveProfileImageUrl } from '@/features/profile/utils/profile-helpers';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

function buildTagline(preferences = {}) {
  if (preferences.bio?.trim()) {
    return preferences.bio.trim();
  }

  const parts = [];
  if (preferences.occupation || preferences.occupation_label) {
    parts.push('Fashion enthusiast');
  }

  const inspiration =
    preferences.style_inspiration?.[0] || preferences.preferred_outfit_types?.[0];
  if (inspiration) {
    parts.push(formatEnumLabel(inspiration));
  } else if (parts.length) {
    parts.push('Minimalist at heart');
  }

  return parts.length
    ? parts.join(' · ')
    : 'Complete your profile to personalize Wardrobe AI';
}

function buildLocation(profile, preferences = {}) {
  const city = preferences.city?.trim();
  const country = profile?.country?.trim();

  if (city && country) return `${city}, ${country}`;
  return city || country || null;
}

export function ProfileHeaderCard({
  profile,
  styleScore,
  isLoading,
  onEditProfile,
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const updatePhotoMutation = useUpdateFacePhotoMutation();

  if (isLoading) {
    return (
      <div
        className={cn(
          'animate-pulse overflow-hidden rounded-3xl p-6 sm:p-7',
          'bg-gradient-to-r from-[#1a1030] via-[#12121f] to-[#0c0f18]',
        )}
      >
        <div className="flex items-center gap-6">
          <div className="size-24 shrink-0 rounded-xl bg-white/5 sm:size-28" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-8 w-48 rounded-lg bg-white/5" />
            <div className="h-4 w-64 rounded bg-white/5" />
            <div className="h-4 w-40 rounded bg-white/5" />
          </div>
          <div className="hidden h-10 w-32 shrink-0 rounded-full bg-white/5 sm:block" />
        </div>
      </div>
    );
  }

  const preferences = profile?.preferences || {};
  const displayName = profile?.name || 'Your Profile';
  const faceImageUrl = withCacheBust(
    resolveProfileImageUrl(profile?.faceImageUrl),
    profile?.updated_at,
  );
  const occupation = preferences.occupation_label
    || (preferences.occupation ? formatEnumLabel(preferences.occupation) : null);
  const location = buildLocation(profile, preferences);
  const tagline = buildTagline(preferences);
  const planLabel = profile?.plan || 'Premium Plan';

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
      <div
        className={cn(
          'interactive-card relative overflow-hidden rounded-3xl p-5 sm:p-6 lg:p-7',
          'bg-gradient-to-r from-[#1a1030] via-[#12121f] to-[#0c0f18]',
          'shadow-[0_20px_60px_-24px_rgba(109,40,217,0.45)]',
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(109,40,217,0.22),transparent_55%)]"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              <div className="flex size-24 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:size-28">
                {faceImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={faceImageUrl}
                    alt={`${displayName} profile`}
                    className="size-full object-cover"
                  />
                ) : (
                  <UserRound className="size-12 text-white/35 sm:size-14" />
                )}
              </div>
              <button
                type="button"
                className={cn(
                  'absolute -bottom-1.5 -right-1.5 flex size-8 items-center justify-center rounded-full',
                  'border-2 border-[#12121f] bg-[#7c3aed] text-white shadow-lg',
                  'transition-transform hover:scale-105',
                )}
                aria-label="Change profile photo"
                disabled={updatePhotoMutation.isPending}
                onClick={() => {
                  setErrorMessage('');
                  setDialogOpen(true);
                }}
              >
                {updatePhotoMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Camera className="size-3.5" />
                )}
              </button>
            </div>

            <div className="min-w-0 flex-1 space-y-2.5 text-center sm:text-left">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">
                  {displayName}
                </h1>
                <p className="mt-1 text-sm text-white/55">{tagline}</p>
              </div>

              {(location || occupation) ? (
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm sm:justify-start">
                  {location ? (
                    <span className="inline-flex items-center gap-1.5 text-white/50">
                      <MapPin className="size-4 shrink-0 text-rose-400" />
                      {location}
                    </span>
                  ) : null}
                  {occupation ? (
                    <span className="inline-flex items-center gap-1.5 text-white/50">
                      <Briefcase className="size-4 shrink-0 text-amber-600" />
                      {occupation}
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7c3aed]/20 px-3.5 py-1.5 text-xs font-medium text-[#c4b5fd]">
                  <Star className="size-3.5 fill-[#a78bfa] text-[#a78bfa]" />
                  {styleScore != null ? `Style Score: ${styleScore} · ` : ''}
                  {planLabel}
                </span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            className={cn(
              'shrink-0 self-center rounded-full border border-white/15 bg-white/5 px-5',
              'text-sm font-medium text-white hover:bg-white/10 hover:text-white',
            )}
            onClick={onEditProfile}
          >
            <Pencil className="size-4" />
            Edit Profile
          </Button>
        </div>
      </div>

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
