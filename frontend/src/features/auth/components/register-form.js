'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, Phone, Sparkles } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { APP_NAME } from '@/constants/app';
import {
  registerSchema,
  toRegisterPayload,
} from '@/features/auth/schemas/auth.schema';
import { useRegisterMutation } from '@/features/auth/hooks/use-auth-mutations';
import { AuthIconInput } from '@/features/auth/components/auth-icon-input';
import { AuthPasswordInput } from '@/features/auth/components/auth-password-input';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/utils/cn';

const authFieldClassName = cn(
  '[&_label]:text-auth-panel-foreground',
  '[&_p]:text-auth-panel-muted',
);

export function RegisterForm() {
  const router = useRouter();
  const registerMutation = useRegisterMutation();

  useEffect(() => {
    router.prefetch(ROUTES.FACE.REGISTER);
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      mobile: '',
      password: '',
      confirmPassword: '',
    },
  });

  const emailField = register('email');
  const mobileField = register('mobile');
  const passwordField = register('password');
  const confirmPasswordField = register('confirmPassword');

  const onSubmit = (values) => {
    registerMutation.mutate(toRegisterPayload(values), {
      onSuccess: () => router.replace(ROUTES.FACE.REGISTER),
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 lg:hidden">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary">
          <Sparkles className="size-5 text-primary-foreground" aria-hidden="true" />
        </span>
        <span className="text-sm font-bold uppercase tracking-[0.18em] text-auth-panel-foreground">
          {APP_NAME}
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-auth-panel-foreground">
          Create your {APP_NAME} account
        </h1>
        <p className="text-sm text-auth-panel-muted">
          Start with email and password. Mobile is optional.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField
          id="email"
          label="Email"
          required
          error={errors.email?.message}
          className={authFieldClassName}
        >
          <AuthIconInput
            id="email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="Enter your email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...emailField}
          />
        </FormField>

        <FormField
          id="mobile"
          label="Mobile"
          hint="Optional. Include country code, e.g. +919876543210"
          error={errors.mobile?.message}
          className={authFieldClassName}
        >
          <AuthIconInput
            id="mobile"
            type="tel"
            icon={Phone}
            autoComplete="tel"
            placeholder="Enter your mobile number"
            aria-invalid={Boolean(errors.mobile)}
            aria-describedby={errors.mobile ? 'mobile-error' : undefined}
            {...mobileField}
          />
        </FormField>

        <FormField
          id="password"
          label="Password"
          required
          hint="Minimum 8 characters"
          error={errors.password?.message}
          className={authFieldClassName}
        >
          <AuthPasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.password?.message}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...passwordField}
          />
        </FormField>

        <FormField
          id="confirmPassword"
          label="Confirm password"
          required
          error={errors.confirmPassword?.message}
          className={authFieldClassName}
        >
          <AuthPasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            {...confirmPasswordField}
          />
        </FormField>

        {registerMutation.isError ? (
          <Alert
            variant="destructive"
            className="border-destructive/40 bg-destructive/10 text-destructive"
          >
            <AlertDescription>
              {registerMutation.error?.message ||
                'Unable to create account. Try again.'}
            </AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={registerMutation.isPending}
          className="h-12 w-full rounded-xl text-base font-semibold"
        >
          {registerMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-auth-panel-muted">
        Already have an account?{' '}
        <Link
          href={ROUTES.AUTH.LOGIN}
          prefetch
          className="font-semibold text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
