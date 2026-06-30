import { AuthGuard } from '@/features/auth/components';
import { DashboardShell } from '@/features/dashboard/components';

export default function ProfileLayout({ children }) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}