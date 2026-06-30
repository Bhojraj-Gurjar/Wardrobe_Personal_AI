'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Camera, Loader2, Mail, ScanFace } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { resolveAuthenticatedLanding } from '@/features/auth/utils/auth-routing';
import { AuthIconInput } from '@/features/auth/components/auth-icon-input';
import { AuthPasswordInput } from '@/features/auth/components/auth-password-input';
import {
  useAdminLoginMutation,
  useAdminFaceLoginMutation,
} from '@/features/admin/hooks';
import { useCamera } from '@/features/face/hooks/use-camera';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/utils/cn';

function preventBrowserAutofillProps() {
  return {
    autoComplete: 'off',
    readOnly: true,
    onFocus: (event) => {
      event.target.readOnly = false;
    },
  };
}

function resolveInputValue(stateValue, elementId) {
  if (typeof document === 'undefined') {
    return String(stateValue || '').trim();
  }

  const domValue = document.getElementById(elementId)?.value;
  return String(domValue ?? stateValue ?? '').trim();
}

export function AdminLoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('password');
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef(null);

  const loginMutation = useAdminLoginMutation();
  const faceLoginMutation = useAdminFaceLoginMutation({
    onSuccess: (data) => {
      router.push(
        resolveAuthenticatedLanding(data?.user, {
          redirect: searchParams.get('redirect'),
        }),
      );
    },
  });

  const { videoRef, error: cameraError, isReady, start, stop, captureFrame } = useCamera();

  useEffect(() => {
    if (mode === 'face') {
      start();
    } else {
      stop();
    }
    return () => stop();
  }, [mode, start, stop]);

  const handlePasswordLogin = (event) => {
    event.preventDefault();
    setFormError('');

    const resolvedEmail = resolveInputValue(email, 'admin-email');
    const resolvedPassword = resolveInputValue(password, 'admin-password');

    if (resolvedEmail !== email) {
      setEmail(resolvedEmail);
    }

    if (resolvedPassword !== password) {
      setPassword(resolvedPassword);
    }

    if (!resolvedEmail) {
      setFormError('Enter a valid admin email.');
      return;
    }

    if (!resolvedPassword) {
      setFormError('Enter your admin password.');
      return;
    }

    loginMutation.mutate(
      { email: resolvedEmail, password: resolvedPassword },
      {
        onSuccess: (data) => {
          router.push(
            resolveAuthenticatedLanding(data?.user, {
              redirect: searchParams.get('redirect'),
            }),
          );
        },
      },
    );
  };

  const handleFaceCapture = async () => {
    const blob = await captureFrame();
    if (!blob) return;
    const file = new File([blob], 'admin-face-login.jpg', { type: 'image/jpeg' });
    faceLoginMutation.mutate(file);
  };

  const handleFaceUpload = (file) => {
    if (file) faceLoginMutation.mutate(file);
  };

  const isPending = loginMutation.isPending || faceLoginMutation.isPending;
  const error = formError || loginMutation.error || faceLoginMutation.error;

  return (
    <div className="space-y-5">
      <div className="flex rounded-xl border border-auth-input-border bg-auth-input-bg p-1">
        <button
          type="button"
          onClick={() => setMode('password')}
          className={cn(
            'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            mode === 'password'
              ? 'bg-primary text-primary-foreground'
              : 'text-auth-panel-muted hover:text-auth-panel-foreground',
          )}
        >
          Email & Password
        </button>
        <button
          type="button"
          onClick={() => setMode('face')}
          className={cn(
            'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            mode === 'face'
              ? 'bg-primary text-primary-foreground'
              : 'text-auth-panel-muted hover:text-auth-panel-foreground',
          )}
        >
          Face Login
        </button>
      </div>

      {mode === 'password' ? (
        <form onSubmit={handlePasswordLogin} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="admin-email" className="text-sm font-medium text-auth-panel-foreground">
              Admin email
            </label>
            <AuthIconInput
              id="admin-email"
              type="email"
              icon={Mail}
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onInput={(event) => setEmail(event.target.value)}
              {...preventBrowserAutofillProps()}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="admin-password" className="text-sm font-medium text-auth-panel-foreground">
              Password
            </label>
            <AuthPasswordInput
              id="admin-password"
              placeholder="Enter admin password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onInput={(event) => setPassword(event.target.value)}
              {...preventBrowserAutofillProps()}
            />
          </div>
          <Button type="submit" size="lg" disabled={isPending} className="h-12 w-full rounded-xl">
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Admin Sign in
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="relative mx-auto aspect-[4/3] max-w-sm overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} className="mirror size-full object-cover" playsInline muted />
            <div className="pointer-events-none absolute inset-4 rounded-xl border-2 border-primary/60" />
          </div>
          {cameraError ? (
            <Alert variant="destructive"><AlertDescription>{cameraError}</AlertDescription></Alert>
          ) : null}
          <Button
            size="lg"
            disabled={!isReady || isPending}
            onClick={handleFaceCapture}
            className="h-12 w-full rounded-xl gap-2"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ScanFace className="size-5" />
            )}
            Login With Face
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
            className="h-12 w-full rounded-xl gap-2 border-auth-input-border"
          >
            <Camera className="size-5" />
            Upload Face Image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFaceUpload(e.target.files?.[0])}
          />
        </div>
      )}

      {error ? (
        <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
          <AlertDescription>
            {typeof error === 'string' ? error : error.message || 'Admin login failed.'}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
