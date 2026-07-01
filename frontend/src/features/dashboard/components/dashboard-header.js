'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, Menu, Star } from 'lucide-react';
import { DashboardSearchBar } from '@/features/dashboard/components/dashboard-search-bar';
import { NotificationCenter } from '@/features/notifications';
import { UserProfileCard } from '@/features/dashboard/components/user-profile-card';
import { ROUTES } from '@/constants/routes';
import { useFashionDnaQuery } from '@/features/fashion-dna/hooks';
import { useAuthStore } from '@/stores/auth-store';
import { useProfileQuery } from '@/features/profile/hooks';
import { useUiStore } from '@/stores/ui-store';
import { useIsMobile } from '@/hooks/use-media-query';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';

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
  const user = useAuthStore((state) => state.user);
  const { data: profile } = useProfileQuery();
  const { data: fashionDna } = useFashionDnaQuery();

  const displayName =
    profile?.name || user?.email?.split('@')[0] || 'Your Profile';
  const rawScore =
    fashionDna?.confidenceScore ?? fashionDna?.fashionConfidenceScore;
  const styleScore =
    rawScore != null ? Math.round(rawScore) : null;
  const pageTitle = resolvePageTitle(pathname);
  const pageSubtitle = PAGE_SUBTITLES[pathname];
  const hidePageTitle = pathname === '/wishlist' || pathname === '/cart' || pathname === '/orders' || pathname === '/profile' || pathname === '/search';

  return (
    <header
      className={cn(
        'border-b border-dashboard-border bg-dashboard-bg/95 backdrop-blur supports-[backdrop-filter]:bg-dashboard-bg/80',
        className,
      )}
    >
      <div className="flex flex-col gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 md:py-4 lg:flex-row lg:items-center lg:gap-4 lg:px-6">
        <div className="flex min-w-0 items-center justify-between gap-2 lg:contents">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {isMobile ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-10 shrink-0 text-dashboard-muted hover:text-dashboard-foreground"
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

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:order-3">
            {styleScore !== null ? (
              <span
                className={cn(
                  'hidden items-center gap-1 rounded-full border border-primary/30 sm:inline-flex',
                  'bg-dashboard-accent-soft px-2 py-0.5 text-[11px] font-medium text-primary md:px-2.5 md:py-1 md:text-sm',
                )}
              >
                <Star className="size-3 fill-primary md:size-3.5" aria-hidden="true" />
                <span className="whitespace-nowrap">Style {styleScore}</span>
              </span>
            ) : null}

            <NotificationCenter />

            <Link
              href={ROUTES.PROFILE.HOME}
              className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-dashboard-surface-elevated sm:rounded-xl sm:px-2"
              aria-label="Go to profile"
            >
              <UserProfileCard
                name={displayName}
                subtitle="Premium Plan"
                collapsed
                className="border-0 bg-transparent p-0"
              />
              <ChevronDown className="ml-1 hidden size-4 text-dashboard-muted sm:block" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="w-full min-w-0 lg:order-2 lg:flex-1">
          <DashboardSearchBar />
        </div>
      </div>
    </header>
  );
}
