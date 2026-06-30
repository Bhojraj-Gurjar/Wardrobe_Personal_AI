import { AuthGuard } from '@/features/auth/components';
import { DashboardShell } from '@/features/dashboard/components';

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
