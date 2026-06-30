'use client';

import { ChevronDown, Settings2 } from 'lucide-react';
import { ProfilePremiumCard } from '@/features/profile/components/profile-premium-card';
import { ProfilePersonalSection } from '@/features/profile/components/profile-personal-section';
import { ProfileMeasurementsSection } from '@/features/profile/components/profile-measurements-section';
import { ProfileSettingsSection } from '@/features/profile/components/profile-settings-section';
import { cn } from '@/utils/cn';

export function AccountSettings({
  sectionRef,
  open = false,
  onOpenChange,
}) {
  const toggleOpen = () => {
    onOpenChange?.(!open);
  };

  return (
    <ProfilePremiumCard
      title="Personal & Security"
      description="Personal details, measurements, and account settings"
      icon={Settings2}
      action={
        <button
          type="button"
          onClick={toggleOpen}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2',
            'text-xs font-medium text-dashboard-foreground transition-colors hover:bg-white/10',
          )}
          aria-expanded={open}
        >
          {open ? 'Hide details' : 'Show details'}
          <ChevronDown
            className={cn('size-4 transition-transform duration-300', open && 'rotate-180')}
          />
        </button>
      }
    >
      <div
        className={cn(
          'grid transition-all duration-500 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div ref={sectionRef} className="space-y-6 pt-2">
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-1">
              <ProfilePersonalSection />
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-1">
              <ProfileMeasurementsSection />
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-1">
              <ProfileSettingsSection />
            </div>
          </div>
        </div>
      </div>

      {!open ? (
        <p className="text-sm text-dashboard-muted">
          Name, email, phone, location, occupation, bio, and account settings are tucked away here.
          Expand when you need to update your details.
        </p>
      ) : null}
    </ProfilePremiumCard>
  );
}
