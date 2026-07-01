'use client';

import { useRef } from 'react';
import { DashboardSidebar } from '@/features/dashboard/components/dashboard-sidebar';
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header';
import { SupportRealtimeProvider } from '@/features/customer-support/components/support-realtime-provider';
import { ToastHost } from '@/components/ui/toast-host';
import { useUiStore } from '@/stores/ui-store';
import { useIsMobile, useIsTablet } from '@/hooks/use-media-query';
import { usePinnedHeaderHeight, useSmartHeaderVisibility } from '@/hooks';
import { cn } from '@/utils/cn';

export function DashboardShell({ children, className }) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const collapsed = useUiStore((state) => state.isDashboardSidebarCollapsed);
  const sidebarCollapsed = (collapsed || isTablet) && !isMobile;
  const headerRef = useRef(null);
  const headerHeight = usePinnedHeaderHeight(headerRef);
  const smartHeaderVisible = useSmartHeaderVisibility();
  const isHeaderVisible = isMobile ? true : smartHeaderVisible;

  return (
    <div
      className={cn(
        'app-shell min-h-screen bg-dashboard-bg text-dashboard-foreground',
        className,
      )}
    >
      <DashboardSidebar />
      <SupportRealtimeProvider />
      <div
        className={cn(
          'flex min-h-screen min-w-0 flex-col transition-[margin-left] duration-300',
          !isMobile && (sidebarCollapsed ? 'md:ml-[4.5rem]' : 'md:ml-64'),
        )}
      >
        <div
          ref={headerRef}
          className={cn(
            'safe-area-top fixed top-0 right-0 z-50 w-full',
            'transition-[transform,left] duration-300 ease-out will-change-transform',
            isHeaderVisible ? 'translate-y-0' : '-translate-y-full',
            !isMobile && (sidebarCollapsed ? 'md:left-[4.5rem]' : 'md:left-64'),
          )}
        >
          <DashboardHeader />
        </div>
        <div
          className="shrink-0"
          style={{ height: headerHeight > 0 ? headerHeight : undefined }}
          aria-hidden="true"
        />
        <main className="flex-1 px-3 py-3 sm:px-4 sm:py-4 md:py-6 lg:px-6">{children}</main>
      </div>
      <ToastHost />
    </div>
  );
}
