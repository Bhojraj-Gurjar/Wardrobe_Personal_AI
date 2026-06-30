'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, ScanFace, Upload } from 'lucide-react';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { AdminPageHeader } from '@/features/admin/components/admin-metric-card';
import {
  useAdminProfileQuery,
  useAdminUpdateProfileMutation,
  useAdminChangePasswordMutation,
  useAdminRegisterFaceMutation,
} from '@/features/admin/hooks';
import { useCamera } from '@/features/face/hooks/use-camera';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/utils/cn';

export function AdminProfileView() {
  const { data: profile, isLoading, isError, refetch } = useAdminProfileQuery();
  const updateMutation = useAdminUpdateProfileMutation();
  const passwordMutation = useAdminChangePasswordMutation();
  const faceMutation = useAdminRegisterFaceMutation();

  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [faceMode, setFaceMode] = useState(null);
  const fileInputRef = useRef(null);

  const { videoRef, error: cameraError, isReady, start, stop, captureFrame } = useCamera();

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile?.name]);

  useEffect(() => {
    if (faceMode === 'capture') {
      start();
    } else {
      stop();
    }
    return () => stop();
  }, [faceMode, start, stop]);

  const handleFaceFile = async (file) => {
    if (!file) return;
    faceMutation.mutate(file, {
      onSuccess: () => setFaceMode(null),
    });
  };

  const handleCapture = async () => {
    const blob = await captureFrame();
    if (!blob) return;
    const file = new File([blob], 'admin-face.jpg', { type: 'image/jpeg' });
    handleFaceFile(file);
  };

  if (isLoading) {
    return <LoadingState title="Loading profile…" rows={3} />;
  }

  if (isError) {
    return <ErrorState title="Unable to load profile" onRetry={refetch} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AdminPageHeader label="Admin" title="Profile" />

      <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-6 space-y-4">
        <h3 className="font-semibold text-dashboard-foreground">Account Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-dashboard-muted">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 border-dashboard-border bg-dashboard-bg"
            />
          </div>
          <div>
            <label className="text-xs text-dashboard-muted">Email</label>
            <Input value={profile?.email || ''} disabled className="mt-1 border-dashboard-border bg-dashboard-bg" />
          </div>
          <div>
            <label className="text-xs text-dashboard-muted">Role</label>
            <Input value={profile?.role || 'ADMIN'} disabled className="mt-1 border-dashboard-border bg-dashboard-bg" />
          </div>
        </div>
        <Button
          onClick={() => updateMutation.mutate({ name })}
          disabled={updateMutation.isPending}
        >
          Save Profile
        </Button>
      </div>

      <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-dashboard-foreground">Register Admin Face</h3>
            <p className="text-sm text-dashboard-muted">
              {profile?.faceRegistered
                ? 'Face registered. Update your face embedding anytime.'
                : 'Optional — enable face login for faster admin access.'}
            </p>
          </div>
          <ScanFace className="size-6 text-primary" />
        </div>

        {faceMode === 'capture' ? (
          <div className="space-y-3">
            <div className="relative mx-auto aspect-[4/3] max-w-sm overflow-hidden rounded-2xl bg-black">
              <video ref={videoRef} className="mirror size-full object-cover" playsInline muted />
            </div>
            {cameraError ? (
              <Alert variant="destructive"><AlertDescription>{cameraError}</AlertDescription></Alert>
            ) : null}
            <div className="flex gap-2">
              <Button onClick={handleCapture} disabled={!isReady || faceMutation.isPending}>
                {faceMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                Save Face
              </Button>
              <Button variant="ghost" onClick={() => setFaceMode(null)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" />
              Upload Image
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setFaceMode('capture')}>
              <Camera className="size-4" />
              Capture Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFaceFile(e.target.files?.[0])}
            />
          </div>
        )}

        {faceMutation.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{faceMutation.error?.message}</AlertDescription>
          </Alert>
        ) : null}
        {faceMutation.isSuccess ? (
          <p className="text-sm text-emerald-400" role="status">Face saved successfully.</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-6 space-y-4">
        <h3 className="font-semibold text-dashboard-foreground">Change Password</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-dashboard-muted">Current Password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 border-dashboard-border bg-dashboard-bg"
            />
          </div>
          <div>
            <label className="text-xs text-dashboard-muted">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 border-dashboard-border bg-dashboard-bg"
            />
          </div>
        </div>
        <Button
          onClick={() =>
            passwordMutation.mutate(
              { currentPassword, newPassword },
              {
                onSuccess: () => {
                  setCurrentPassword('');
                  setNewPassword('');
                },
              },
            )
          }
          disabled={passwordMutation.isPending || !currentPassword || !newPassword}
        >
          Update Password
        </Button>
        {passwordMutation.isSuccess ? (
          <p className="text-sm text-emerald-400">Password updated.</p>
        ) : null}
        {passwordMutation.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{passwordMutation.error?.message}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </div>
  );
}
