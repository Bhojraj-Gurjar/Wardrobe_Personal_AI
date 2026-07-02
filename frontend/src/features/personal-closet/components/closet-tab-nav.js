'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CLOSET_TAB_ITEMS,
  CLOSET_TABS,
  getClosetTabHref,
} from '@/features/personal-closet/constants/closet-navigation';
import { cn } from '@/utils/cn';

export function ClosetTabNav({ activeTab = CLOSET_TABS.WARDROBE }) {
  const router = useRouter();

  const handleTabChange = useCallback((tabId) => {
    router.replace(getClosetTabHref(tabId), { scroll: false });
  }, [router]);

  return (
    <div
      className="flex flex-wrap gap-2 rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-2"
      role="tablist"
      aria-label="Personal closet sections"
    >
      {CLOSET_TAB_ITEMS.map((item) => {
        const isActive = activeTab === item.id;

        return (
          <motion.button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTabChange(item.id)}
            className={cn(
              'min-w-[140px] flex-1 rounded-[18px] border px-4 py-3 text-left transition-all duration-200',
              isActive
                ? 'border-[#7C3AED]/40 bg-[#7C3AED]/15 shadow-[0_0_20px_rgba(124,58,237,0.15)]'
                : 'border-transparent bg-transparent hover:border-white/[0.08] hover:bg-white/[0.03]',
            )}
          >
            <span className={cn(
              'block text-sm font-semibold',
              isActive ? 'text-white' : 'text-white/70',
            )}
            >
              {item.label}
            </span>
            <span className="mt-0.5 block text-xs text-white/45">
              {item.description}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
