'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  Plus,
  ShoppingBag,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/utils/cn';
import {
  CLOSET_GLASS_CARD,
  CLOSET_TRANSITION,
} from '@/features/personal-closet/styles/closet-design-tokens';

const ACTIONS = [
  {
    id: 'create',
    label: 'Create Outfit',
    icon: Plus,
    href: ROUTES.AVATAR.HOME,
  },
  {
    id: 'generate',
    label: 'Generate AI Outfit',
    icon: Wand2,
    href: ROUTES.AI.RECOMMENDATIONS,
  },
  {
    id: 'import',
    label: 'Import Outfit',
    icon: Upload,
    href: ROUTES.AI.VIRTUAL_TRY_ON,
  },
  {
    id: 'browse',
    label: 'Browse Products',
    icon: ShoppingBag,
    href: ROUTES.PRODUCTS.LIST,
  },
  {
    id: 'recommendations',
    label: 'AI Recommendations',
    icon: Sparkles,
    href: ROUTES.AI.RECOMMENDATIONS,
  },
  {
    id: 'export',
    label: 'Export Closet',
    icon: Download,
    action: 'export',
  },
];

export const ClosetQuickActions = memo(function ClosetQuickActions({
  onExport,
  className,
}) {
  const router = useRouter();

  return (
    <section className={cn(CLOSET_GLASS_CARD, 'p-4 md:p-5', className)}>
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A855F7]">
          Quick Actions
        </p>
        <p className="mt-1 text-sm text-white/50">
          Shortcuts to build, discover, and manage your wardrobe.
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ACTIONS.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.35 }}
              onClick={() => {
                if (item.action === 'export') {
                  onExport?.();
                  return;
                }

                router.push(item.href);
              }}
              className={cn(
                'group flex min-w-[148px] shrink-0 flex-col items-start gap-3 rounded-[18px] border border-white/[0.08]',
                'bg-gradient-to-br from-white/[0.06] to-transparent px-4 py-4 text-left',
                CLOSET_TRANSITION,
                'hover:-translate-y-0.5 hover:border-[#7C3AED]/35 hover:shadow-[0_12px_32px_rgba(124,58,237,0.2)]',
              )}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#7C3AED]/15 text-[#C4B5FD] transition group-hover:scale-105 group-hover:bg-[#7C3AED]/25">
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-white">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
});

ClosetQuickActions.displayName = 'ClosetQuickActions';
