'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Mail } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { GuestGuard, LoginLayout } from '@/features/auth/components';
import { AuthIconInput } from '@/features/auth/components/auth-icon-input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  }

  return (
    <GuestGuard>
      <LoginLayout>
        <div className="space-y-6">
          <Link
            href={ROUTES.AUTH.LOGIN}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-auth-panel-foreground">
              Forgot password?
            </h1>
            <p className="text-sm text-auth-panel-muted">
              Enter your email and we&apos;ll send reset instructions if an account exists.
            </p>
          </div>

          {submitted ? (
            <Alert className="border-primary/30 bg-primary/10">
              <AlertDescription className="text-auth-panel-foreground">
                If <strong>{email}</strong> is registered, you&apos;ll receive password reset
                instructions shortly. Check your inbox and spam folder.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <label htmlFor="reset-email" className="text-sm font-medium text-auth-panel-foreground">
                  Email address
                </label>
                <AuthIconInput
                  id="reset-email"
                  type="email"
                  icon={Mail}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="h-12 w-full rounded-xl text-base font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    Send reset link
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </LoginLayout>
    </GuestGuard>
  );
}
