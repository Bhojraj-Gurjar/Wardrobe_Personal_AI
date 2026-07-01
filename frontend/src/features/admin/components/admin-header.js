'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, Menu, Search } from 'lucide-react';
import { NotificationCenter } from '@/features/notifications';
import { ROUTES } from '@/constants/routes';
import { getAdminAccessToken, useAdminAccessToken, useAdminProfile } from '@/stores/auth-store';
import { useAdminProfileQuery } from '@/features/admin/hooks';
import { useUiStore } from '@/stores/ui-store';
import { useIsMobile } from '@/hooks/use-media-query';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PAGE_LABELS = {
  [ROUTES.ADMIN.DASHBOARD]: 'Admin Dashboard',
  [ROUTES.ADMIN.USERS]: 'Users',
  [ROUTES.ADMIN.PRODUCTS]: 'Products',
  [ROUTES.ADMIN.ORDERS]: 'Order History',
  [ROUTES.ADMIN.SUPPORT]: 'Support Tickets',
  [ROUTES.ADMIN.ANALYTICS]: 'Analytics',
  [ROUTES.ADMIN.PROFILE]: 'Profile',
};

const ANALYTICS_SUB_LABELS = {
  [ROUTES.ADMIN.ANALYTICS_CUSTOMERS]: 'Analytics › Customers',
  [ROUTES.ADMIN.ANALYTICS_PRODUCTS]: 'Analytics › Product Analytics',
};

function resolveBreadcrumb(pathname) {
  if (ANALYTICS_SUB_LABELS[pathname]) {
    return ANALYTICS_SUB_LABELS[pathname];
  }

  const match = Object.entries(PAGE_LABELS).find(
    ([route]) => pathname === route || pathname.startsWith(`${route}/`),
  );
  return match?.[1] || 'Admin';
}

export function AdminHeader() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const toggleMobileSidebar = useUiStore((state) => state.toggleMobileSidebar);
  const user = useAdminProfile();
  const { data: profile } = useAdminProfileQuery();
  const [search, setSearch] = useState('');

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Admin';
  const breadcrumb = resolveBreadcrumb(pathname);

  return (
    <header className="safe-area-top sticky top-0 z-30 border-b border-dashboard-border bg-dashboard-bg/95 backdrop-blur">
      <div className="flex flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 lg:flex-row lg:items-center lg:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {isMobile ? (
            <Button
              variant="ghost"
              size="icon"
              className="touch-target shrink-0 text-dashboard-muted hover:text-dashboard-foreground"
              onClick={toggleMobileSidebar}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-xs text-dashboard-muted">Admin · {breadcrumb}</p>
            <h1 className="page-title truncate font-bold text-dashboard-foreground">{breadcrumb}</h1>
          </div>
        </div>

        <div className="relative w-full min-w-0 flex-1 lg:mx-auto lg:max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dashboard-muted"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search styles, brands, outfits..."
            className="h-11 w-full border-dashboard-border bg-dashboard-surface pl-10 text-dashboard-foreground placeholder:text-dashboard-muted"
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <NotificationCenter isAdmin />

          <Link
            href={ROUTES.ADMIN.PROFILE}
            className="touch-target flex items-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-surface px-2 py-1.5 sm:px-3 sm:py-2"
            aria-label="Admin profile"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
              {displayName[0]?.toUpperCase()}
            </span>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium text-dashboard-foreground">
                {displayName}
              </p>
              <p className="text-xs text-dashboard-muted">Administrator</p>
            </div>
            <ChevronDown className="hidden size-4 text-dashboard-muted sm:block" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
