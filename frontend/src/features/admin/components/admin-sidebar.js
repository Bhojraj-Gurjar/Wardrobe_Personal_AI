'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
import { APP_NAME } from '@/constants/app';
import { ADMIN_NAV_ITEMS } from '@/features/admin/constants/admin-nav';
import { useUiStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { useAdminProfileQuery } from '@/features/admin/hooks';
import { useIsMobile, useIsTablet } from '@/hooks/use-media-query';
import { useMobileDrawer } from '@/hooks/use-mobile-drawer';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';

function NavItem({ item, collapsed, onNavigate }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      prefetch
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-dashboard-accent-soft text-primary'
          : 'text-dashboard-muted hover:bg-dashboard-surface-elevated hover:text-dashboard-foreground',
        collapsed && 'justify-center px-2',
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {!collapsed ? <span>{item.label}</span> : null}
      {isActive && !collapsed ? (
        <span className="ml-auto size-1.5 rounded-full bg-primary" aria-hidden="true" />
      ) : null}
    </Link>
  );
}

export function AdminSidebar() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isOpen = useUiStore((state) => state.isMobileSidebarOpen);
  const collapsed = useUiStore((state) => state.isDashboardSidebarCollapsed);
  const toggleCollapsed = useUiStore((state) => state.toggleDashboardSidebarCollapsed);
  const setMobileOpen = useUiStore((state) => state.setMobileSidebarOpen);
  const user = useAuthStore((state) => state.user);
  const { data: profile } = useAdminProfileQuery();

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Admin';
  const closeMobile = () => setMobileOpen(false);
  const isCollapsedDesktop = (collapsed || isTablet) && !isMobile;

  useMobileDrawer(isMobile && isOpen, closeMobile);

  const content = (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'flex shrink-0 items-center gap-3 border-b border-dashboard-border px-4 py-5',
          isCollapsedDesktop && 'justify-center px-2',
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary">
          <Sparkles className="size-4 text-primary-foreground" aria-hidden="true" />
        </span>
        {!isCollapsedDesktop ? (
          <p className="text-[10px] font-bold tracking-[0.2em] text-dashboard-muted">
            {APP_NAME.toUpperCase()}
          </p>
        ) : null}
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-dashboard-muted hover:text-dashboard-foreground"
            onClick={closeMobile}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {!isCollapsedDesktop ? (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-dashboard-muted">
            Admin
          </p>
        ) : null}
        <nav className="space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              collapsed={isCollapsedDesktop}
              onNavigate={isMobile ? closeMobile : undefined}
            />
          ))}
        </nav>
      </div>

      <div className="shrink-0 space-y-2 border-t border-dashboard-border p-3">
        {!isCollapsedDesktop ? (
          <div className="rounded-xl bg-dashboard-surface-elevated px-3 py-3">
            <p className="truncate text-sm font-medium text-dashboard-foreground">
              {displayName}
            </p>
            <p className="text-xs text-dashboard-muted">Administrator</p>
          </div>
        ) : null}

        {!isMobile ? (
          <Button
            variant="ghost"
            size={isCollapsedDesktop ? 'icon' : 'default'}
            onClick={toggleCollapsed}
            className={cn(
              'w-full text-dashboard-muted hover:text-dashboard-foreground',
              !isCollapsedDesktop && 'justify-start gap-2',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <>
                <ChevronLeft className="size-4" />
                Collapse
              </>
            )}
          </Button>
        ) : null}

        <LogoutButton
          collapsed={isCollapsedDesktop}
          onNavigate={isMobile ? closeMobile : undefined}
          className={cn(
            'text-dashboard-muted hover:text-destructive',
            !isCollapsedDesktop && 'justify-start gap-2',
          )}
        />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
            isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          onClick={closeMobile}
          aria-hidden="true"
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation menu"
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-[min(16rem,88vw)] border-r border-dashboard-border bg-dashboard-surface safe-area-top safe-area-bottom transition-transform duration-300 ease-out',
            isOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {content}
        </aside>
      </>
    );
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 hidden border-r border-dashboard-border bg-dashboard-surface transition-[width] duration-300 md:block',
        isCollapsedDesktop ? 'w-[4.5rem]' : 'w-64',
      )}
    >
      {content}
    </aside>
  );
}
