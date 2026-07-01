'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { DashboardSearchBar } from '@/features/dashboard/components/dashboard-search-bar';
import { DashboardHeaderActions } from '@/features/dashboard/components/dashboard-header-actions';
import { useUserProfile } from '@/stores/auth-store';
import { useProfileQuery } from '@/features/profile/hooks';
import { useUiStore } from '@/stores/ui-store';
import { useIsMobile } from '@/hooks/use-media-query';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import {
  resolveUserAvatarPhotoUrl,
  resolveUserDisplayName,
} from '@/features/profile/utils/profile-helpers';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/fashion-dna': 'Fashion DNA',
  '/face-analysis': 'Face Analysis',
  '/body-analysis': 'Body Analysis',
  '/digital-avatar': 'Digital Avatar',
  '/recommendations': 'Recommendations',
  '/stylist': 'AI Stylist',
  '/virtual-try-on': 'Virtual Try-On',
  '/products': 'Products',
  '/search': 'Search',
  '/wishlist': 'My Wishlist',
  '/cart': 'Shopping Cart',
  '/orders': 'Order History',
  '/support': 'Support Center',
  '/support/new': 'Create Ticket',
  '/support/tickets': 'My Tickets',
  '/my-closet': 'Personal Closet',
  '/profile': 'Profile',
  '/profile/settings': 'Settings',
};

const PAGE_SUBTITLES = {
  '/digital-avatar': 'Build your perfect outfit look.',
  '/face-analysis': 'AI-powered facial feature mapping',
};

function resolvePageTitle(pathname) {
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }

  const match = Object.entries(PAGE_TITLES)
    .sort(([left], [right]) => right.length - left.length)
    .find(([route]) => pathname === route || pathname.startsWith(`${route}/`));

  return match?.[1] || 'Dashboard';
}

export function DashboardHeader({ className }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const toggleMobileSidebar = useUiStore((state) => state.toggleMobileSidebar);
  const user = useUserProfile();
  const { data: profile } = useProfileQuery();

  const displayName = resolveUserDisplayName({ profile, user });
  const avatarUrl = resolveUserAvatarPhotoUrl(profile);
  const planLabel = profile?.plan || 'Premium Plan';
  const pageTitle = resolvePageTitle(pathname);
  const pageSubtitle = PAGE_SUBTITLES[pathname];
  const hidePageTitle = pathname === '/wishlist' || pathname === '/cart' || pathname === '/orders' || pathname === '/profile' || pathname === '/search';

  return (
    <header
      className={cn(
        'overflow-visible border-b border-dashboard-border bg-dashboard-bg/95 backdrop-blur supports-[backdrop-filter]:bg-dashboard-bg/80',
        className,
      )}
    >
      <div
        className={cn(
          'grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] gap-x-3 gap-y-2 px-3 py-2',
          'sm:gap-x-4 sm:px-4 sm:py-3 md:py-4',
          'lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:grid-rows-1 lg:items-center lg:gap-4 lg:px-6',
        )}
      >
        <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 sm:gap-3 lg:max-w-xs">
          {isMobile ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 text-dashboard-muted hover:text-dashboard-foreground"
              onClick={toggleMobileSidebar}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          ) : null}
          <div className="min-w-0">
            {!hidePageTitle ? (
              <h1 className="truncate text-xl font-bold text-dashboard-foreground md:text-2xl lg:text-[1.5rem]">
                {pageTitle}
              </h1>
            ) : null}
            {pageSubtitle ? (
              <p className="truncate text-[11px] text-dashboard-muted md:text-sm">{pageSubtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="col-start-2 row-start-1 flex justify-end lg:col-start-3">
          <DashboardHeaderActions
            displayName={displayName}
            avatarUrl={avatarUrl}
            planLabel={planLabel}
          />
        </div>

        <div className="col-span-2 row-start-2 min-w-0 lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <DashboardSearchBar />
        </div>
      </div>
    </header>
  );
}
