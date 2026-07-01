'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { OMS_TABS } from '@/features/checkout/constants/checkout.constants';
import { cn } from '@/utils/cn';

export const AdminOmsStatusTabs = memo(function AdminOmsStatusTabs({
  activeTab,
  onTabChange,
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Order status filters">
      {OMS_TABS.map((item) => {
        const isActive = activeTab === item.id;

        return (
          <motion.button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            whileTap={{ scale: 0.97 }}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
              isActive
                ? 'border-primary bg-primary/15 text-primary shadow-[0_0_16px_rgba(139,92,246,0.15)]'
                : 'border-dashboard-border text-dashboard-muted hover:border-primary/30 hover:text-dashboard-foreground',
            )}
          >
            {item.label}
          </motion.button>
        );
      })}
    </div>
  );
});
