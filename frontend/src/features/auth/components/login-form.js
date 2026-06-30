'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  Loader2,
  Mail,
  Phone,
  ScanFace,
  Shield,
  Sparkles,
  User,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { resolveAuthenticatedLanding } from '@/features/auth/utils/auth-routing';
import { APP_NAME } from '@/constants/app';
import {
  loginSchema,
  toLoginPayload,
} from '@/features/auth/schemas/auth.schema';
import { useLoginMutation } from '@/features/auth/hooks/use-auth-mutations';
import { AdminLoginPanel } from '@/features/admin/components/admin-login-panel';
import { AuthIconInput } from '@/features/auth/components/auth-icon-input';
import { AuthPasswordInput } from '@/features/auth/components/auth-password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/utils/cn';

function preventBrowserAutofillProps(field) {
  return {
    autoComplete: 'off',
    readOnly: true,
    onFocus: (event) => {
      event.target.readOnly = false;
      field.onFocus?.(event);
    },
  };
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginMutation = useLoginMutation();
  const [loginType, setLoginType] = useState('user');

  useEffect(() => {
    router.prefetch(ROUTES.FACE.LOGIN);
  }, [router]);

  const sessionReason = searchParams.get('reason');
  const sessionMessage = sessionReason === 'session_expired'
    ? 'Your session has expired. Please login again.'
    : sessionReason === 'forbidden'
      ? 'You do not have access to that page. Please sign in with the correct account.'
      : null;

  useEffect(() => {
    if (searchParams.get('loginType') === 'admin') {
      setLoginType('admin');
    }
  }, [searchParams]);

  useEffect(() => {
    router.prefetch(ROUTES.FACE.LOGIN);
  }, [router]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginMethod: 'email',
      email: '',
      mobile: '',
      password: '',
      rememberMe: false,
    },
  });

  const loginMethod = watch('loginMethod');
  const emailField = register('email');
  const mobileField = register('mobile');
  const passwordField = register('password');

  const onSubmit = (values) => {
    loginMutation.mutate(toLoginPayload(values), {
      onSuccess: (data) => {
        router.push(
          resolveAuthenticatedLanding(data?.user, {
            redirect: searchParams.get('redirect'),
          }),
        );
      },
    });
  };

  const toggleLoginMethod = () => {
    setValue('loginMethod', loginMethod === 'email' ? 'mobile' : 'email', {
      shouldValidate: false,
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
          Welcome back
        </h1>
        <p className="text-sm text-auth-panel-muted">
          Sign in to your {APP_NAME} account
        </p>
      </div>

      {sessionMessage ? (
        <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-100">
          <AlertDescription>{sessionMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex rounded-xl border border-auth-input-border bg-auth-input-bg p-1">
        <button
          type="button"
          onClick={() => setLoginType('user')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            loginType === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'text-auth-panel-muted hover:text-auth-panel-foreground',
          )}
        >
          <User className="size-4" aria-hidden="true" />
          User Login
        </button>
        <button
          type="button"
          onClick={() => setLoginType('admin')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            loginType === 'admin'
              ? 'bg-primary text-primary-foreground'
              : 'text-auth-panel-muted hover:text-auth-panel-foreground',
          )}
        >
          <Shield className="size-4" aria-hidden="true" />
          Admin Login
        </button>
      </div>

      {loginType === 'admin' ? (
        <AdminLoginPanel />
      ) : (
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        noValidate
        autoComplete="off"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor={loginMethod === 'email' ? 'email' : 'mobile'}
              className="text-sm font-medium text-auth-panel-foreground"
            >
              {loginMethod === 'email' ? 'Email address' : 'Mobile number'}
            </label>
            <button
              type="button"
              onClick={toggleLoginMethod}
              className="text-xs font-medium text-primary hover:underline"
            >
              Use {loginMethod === 'email' ? 'mobile' : 'email'} instead
            </button>
          </div>

          {loginMethod === 'email' ? (
            <AuthIconInput
              id="email"
              type="email"
              icon={Mail}
              placeholder="Enter your email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...emailField}
              {...preventBrowserAutofillProps(emailField)}
            />
          ) : (
            <AuthIconInput
              id="mobile"
              type="tel"
              icon={Phone}
              placeholder="Enter your mobile number"
              aria-invalid={Boolean(errors.mobile)}
              aria-describedby={errors.mobile ? 'mobile-error' : undefined}
              {...mobileField}
              {...preventBrowserAutofillProps(mobileField)}
            />
          )}

          {loginMethod === 'email' && errors.email ? (
            <p id="email-error" className="text-xs text-destructive" role="alert">
              {errors.email.message}
            </p>
          ) : null}
          {loginMethod === 'mobile' && errors.mobile ? (
            <p id="mobile-error" className="text-xs text-destructive" role="alert">
              {errors.mobile.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-auth-panel-foreground"
          >
            Password
          </label>
          <AuthPasswordInput
            id="password"
            placeholder="Enter your password"
            error={errors.password?.message}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...passwordField}
            {...preventBrowserAutofillProps(passwordField)}
          />
          {errors.password ? (
            <p id="password-error" className="text-xs text-destructive" role="alert">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-4">
          <Checkbox
            id="rememberMe"
            label="Remember me"
            {...register('rememberMe')}
          />
          <Link
            href={ROUTES.AUTH.FORGOT_PASSWORD}
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>


        {loginMutation.isError ? (
          <Alert
            variant="destructive"
            className="border-destructive/40 bg-destructive/10 text-destructive"
          >
            <AlertDescription>
              {loginMutation.error?.message || 'Unable to sign in. Try again.'}
            </AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={loginMutation.isPending}
          className="h-12 w-full rounded-xl text-base font-semibold"
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          asChild
          className={cn(
            'h-12 w-full rounded-xl border-auth-input-border bg-auth-input-bg',
            'text-auth-panel-foreground hover:bg-auth-input-bg/80 hover:text-auth-panel-foreground',
          )}
        >
          <Link href={ROUTES.FACE.LOGIN}>
            <ScanFace className="size-5 text-primary" aria-hidden="true" />
            Sign in with Face ID
          </Link>
        </Button>
      </form>
      )}

      {loginType === 'user' ? (
      <p className="text-center text-sm text-auth-panel-muted">
        Don&apos;t have an account?{' '}
        <Link
          href={ROUTES.AUTH.REGISTER}
          className="font-semibold text-primary hover:underline"
        >
          Create one free
        </Link>
      </p>
      ) : null}
    </div>
  );
}
