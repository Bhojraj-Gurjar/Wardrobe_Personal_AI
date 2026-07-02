'use client';

import { CLOSET_PREVIEW_LIMIT } from '@/features/personal-closet/constants/closet-navigation';
import { ClosetViewAllLink } from '@/features/personal-closet/components/closet-view-all-link';

export function ClosetSectionHeader({
  title,
  description,
  viewAllHref = null,
  totalCount = 0,
  previewLimit = CLOSET_PREVIEW_LIMIT,
}) {
  const showViewAll = Boolean(viewAllHref) && totalCount > previewLimit;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A855F7]">
          {title}
        </p>
        {description ? (
          <p className="text-sm text-white/50">{description}</p>
        ) : null}
      </div>
      {showViewAll ? <ClosetViewAllLink href={viewAllHref} /> : null}
    </div>
  );
}
