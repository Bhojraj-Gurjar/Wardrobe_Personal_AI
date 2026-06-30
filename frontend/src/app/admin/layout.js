'use client';

import { AdminGuard, AdminShell } from '@/features/admin/components';

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
