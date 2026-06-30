import { AuthLayout, GuestGuard, RegisterForm } from '@/features/auth/components';

export const metadata = {
  title: 'Create account',
};

export default function RegisterPage() {
  return (
    <GuestGuard>
      <AuthLayout>
        <RegisterForm />
      </AuthLayout>
    </GuestGuard>
  );
}
