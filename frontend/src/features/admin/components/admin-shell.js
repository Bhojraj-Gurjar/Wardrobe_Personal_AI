'use client';

import { AdminSidebar } from '@/features/admin/components/admin-sidebar';
import { AdminHeader } from '@/features/admin/components/admin-header';
import { SupportRealtimeProvider } from '@/features/customer-support/components/support-realtime-provider';
import { ToastHost } from '@/components/ui/toast-host';
import { useUiStore } from '@/stores/ui-store';
import { useIsMobile, useIsTablet } from '@/hooks/use-media-query';
import { cn } from '@/utils/cn';

export function AdminShell({ children, className }) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const collapsed = useUiStore((state) => state.isDashboardSidebarCollapsed);
  const sidebarCollapsed = (collapsed || isTablet) && !isMobile;

  return (
    <div className={cn('app-shell min-h-screen bg-dashboard-bg text-dashboard-foreground', className)}>
      <AdminSidebar />
      <SupportRealtimeProvider isAdmin />
      <div
        className={cn(
          'flex min-h-screen min-w-0 flex-col transition-[margin-left] duration-300',
          !isMobile && (sidebarCollapsed ? 'md:ml-[4.5rem]' : 'md:ml-64'),
        )}
      >
        <AdminHeader />
        <main className="flex-1 px-3 py-3 sm:px-4 sm:py-4 md:py-6 lg:px-6">{children}</main>
      </div>
      <ToastHost />
    </div>
  );
}
