import { AuthGuard } from '@/features/auth/components';
import { DashboardShell } from '@/features/dashboard/components';

export default function AiLayout({ children }) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
