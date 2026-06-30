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
        'sticky top-0 z-30 border-b border-dashboard-border bg-dashboard-bg/95 backdrop-blur',
        className,
      )}
    >
      <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:px-6">
        <div className="flex items-center gap-3">
          {isMobile ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-dashboard-muted hover:text-dashboard-foreground"
              onClick={toggleMobileSidebar}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          ) : null}
          <div>
            {!hidePageTitle ? (
              <h1 className="text-xl font-bold text-dashboard-foreground">{pageTitle}</h1>
            ) : null}
            {pageSubtitle ? (
              <p className="text-xs text-dashboard-muted sm:text-sm">{pageSubtitle}</p>
            ) : null}
          </div>
        </div>

        <DashboardSearchBar />

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          {styleScore !== null ? (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-primary/30',
                'bg-dashboard-accent-soft px-3 py-1.5 text-sm font-medium text-primary',
              )}
            >
              <Star className="size-3.5 fill-primary" aria-hidden="true" />
              Style Score {styleScore}
            </span>
          ) : null}

          <NotificationCenter />

          <Link
            href={ROUTES.PROFILE.HOME}
            className={cn(
              'hidden items-center gap-2 rounded-xl px-1 py-1 transition-all duration-200 sm:flex',
              'hover:bg-dashboard-surface-elevated',
            )}
            aria-label="Go to profile"
          >
            <UserProfileCard
              name={displayName}
              subtitle="Premium Plan"
              className="border-0 bg-transparent p-0"
            />
            <ChevronDown className="size-4 text-dashboard-muted" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
