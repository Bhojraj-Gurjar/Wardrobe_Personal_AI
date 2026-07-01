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
import { ROUTES } from '@/constants/routes';
import {
  SIDEBAR_NAV_SECTIONS,
  SIDEBAR_STYLES,
} from '@/components/layout/sidebar-nav.config';
import { isNavItemActive } from '@/features/dashboard/utils/nav-active.util';
import { UserProfileCard } from '@/features/dashboard/components/user-profile-card';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { useUiStore } from '@/stores/ui-store';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';
import { useProfileQuery } from '@/features/profile/hooks';
import { useIsMobile, useIsTablet } from '@/hooks/use-media-query';
import { useMobileDrawer } from '@/hooks/use-mobile-drawer';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';

export const SIDEBAR_WIDTH = {
  expanded: '16rem',
  collapsed: '4.5rem',
};

function SidebarNavItem({ item, collapsed, onNavigate }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = isNavItemActive(pathname, item.href, {
    exact: item.match === 'exact',
  });

  return (
    <Link
      href={item.href}
      prefetch
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        SIDEBAR_STYLES.itemBase,
        isActive ? SIDEBAR_STYLES.itemActive : SIDEBAR_STYLES.itemInactive,
        collapsed && 'justify-center px-2',
      )}
    >
      <Icon className={SIDEBAR_STYLES.itemIcon} aria-hidden="true" />
      {!collapsed ? <span>{item.label}</span> : null}
      {isActive && !collapsed ? (
        <span className={SIDEBAR_STYLES.activeDot} aria-hidden="true" />
      ) : null}
    </Link>
  );
}

function SidebarBrand({ collapsed }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 py-5',
        collapsed && 'justify-center px-2',
      )}
    >
      <span className={SIDEBAR_STYLES.logo}>
        <Sparkles className="size-4 text-white" aria-hidden="true" />
      </span>
      {!collapsed ? (
        <p className={SIDEBAR_STYLES.brandTitle}>{APP_NAME.toUpperCase()}</p>
      ) : null}
    </div>
  );
}

function SidebarNavigation({ collapsed, onNavigate }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
      {SIDEBAR_NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          {!collapsed ? (
            <p className={SIDEBAR_STYLES.sectionLabel}>{section.title}</p>
          ) : null}
          <nav className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </nav>
        </div>
      ))}
    </div>
  );
}

function SidebarFooter({
  collapsed,
  displayName,
  isMobile,
  onNavigate,
  onToggleCollapsed,
}) {
  return (
    <div className="mt-auto shrink-0 space-y-2 border-t border-white/[0.06] p-3">
      <UserProfileCard
        name={displayName}
        subtitle="Premium Plan"
        collapsed={collapsed}
        href={ROUTES.PROFILE.HOME}
        onNavigate={onNavigate}
      />
      <LogoutButton
        collapsed={collapsed}
        onNavigate={onNavigate}
        className={cn(
          'rounded-lg text-slate-400 transition-colors',
          'hover:bg-purple-500/10 hover:text-purple-300',
          collapsed ? 'justify-center px-2' : 'justify-start gap-3 px-3',
        )}
      />
      {!isMobile ? (
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'w-full rounded-lg text-slate-400 transition-colors',
            'hover:bg-white/[0.04] hover:text-slate-200',
            collapsed ? 'justify-center px-2' : 'justify-start gap-3 px-3',
          )}
          onClick={onToggleCollapsed}
        >
          {collapsed ? (
            <ChevronRight className="size-4" aria-hidden="true" />
          ) : (
            <>
              <ChevronLeft className="size-4" aria-hidden="true" />
              Collapse
            </>
          )}
        </Button>
      ) : null}
    </div>
  );
}

export function Sidebar({ className }) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isOpen = useUiStore((state) => state.isMobileSidebarOpen);
  const collapsed = useUiStore((state) => state.isDashboardSidebarCollapsed);
  const toggleCollapsed = useUiStore(
    (state) => state.toggleDashboardSidebarCollapsed,
  );
  const setMobileOpen = useUiStore((state) => state.setMobileSidebarOpen);
  const user = useUserProfile();
  const { data: profile } = useProfileQuery();

  const displayName =
    profile?.name || user?.email?.split('@')[0] || 'Your Profile';
  const closeMobile = () => setMobileOpen(false);
  const isCollapsedDesktop = (collapsed || isTablet) && !isMobile;

  useMobileDrawer(isMobile && isOpen, closeMobile);

  const content = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative">
        <SidebarBrand collapsed={isCollapsedDesktop} />
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-4 text-slate-400 hover:text-white"
            onClick={closeMobile}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </Button>
        ) : null}
      </div>

      <SidebarNavigation
        collapsed={isCollapsedDesktop}
        onNavigate={closeMobile}
      />

      <SidebarFooter
        collapsed={isCollapsedDesktop}
        displayName={displayName}
        isMobile={isMobile}
        onNavigate={closeMobile}
        onToggleCollapsed={toggleCollapsed}
      />
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div
          className={cn(
            'fixed inset-0 z-40 bg-[#060b1f]/85 backdrop-blur-sm transition-opacity duration-300',
            isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          onClick={closeMobile}
          aria-hidden="true"
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={cn(
            'fixed left-0 top-0 z-50 h-[100dvh] w-[min(18rem,88vw)] safe-area-top safe-area-bottom',
            SIDEBAR_STYLES.panel,
            'transition-transform duration-300 ease-out',
            isOpen ? 'translate-x-0' : '-translate-x-full',
            className,
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
        'fixed left-0 top-0 z-40 hidden h-screen transition-[width] duration-300 md:block',
        SIDEBAR_STYLES.panel,
        isCollapsedDesktop ? 'w-[4.5rem]' : 'w-64',
        className,
      )}
    >
      {content}
    </aside>
  );
}
