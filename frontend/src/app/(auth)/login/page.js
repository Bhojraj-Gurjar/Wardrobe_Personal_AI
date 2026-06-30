import { GuestGuard, LoginForm, LoginLayout } from '@/features/auth/components';
import { LoadingState } from '@/components/shared/loading-state';
import { Suspense } from 'react';

export const metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return (
    <GuestGuard>
      <LoginLayout>
        <Suspense fallback={<LoadingState title="Loading…" rows={1} />}>
          <LoginForm />
        </Suspense>
      </LoginLayout>
    </GuestGuard>
  );
}
