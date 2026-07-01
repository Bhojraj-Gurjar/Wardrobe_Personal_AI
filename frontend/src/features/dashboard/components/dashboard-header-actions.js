'use client';

import { NotificationCenter } from '@/features/notifications';
import { DashboardProfileMenu } from '@/features/dashboard/components/dashboard-profile-menu';
import { cn } from '@/utils/cn';

export const HEADER_ICON_BUTTON_CLASS = cn(
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
);

export const HEADER_AVATAR_TRIGGER_CLASS = 'shrink-0';

export function DashboardHeaderActions({
  displayName,
  avatarUrl,
  planLabel,
  className,
}) {
  return (
    <div className={cn('flex shrink-0 items-center gap-3.5 sm:gap-4', className)}>
      <NotificationCenter minimalTrigger triggerClassName={HEADER_ICON_BUTTON_CLASS} />

      <DashboardProfileMenu
        displayName={displayName}
        avatarUrl={avatarUrl}
        planLabel={planLabel}
        triggerClassName={HEADER_AVATAR_TRIGGER_CLASS}
      />
    </div>
  );
}
