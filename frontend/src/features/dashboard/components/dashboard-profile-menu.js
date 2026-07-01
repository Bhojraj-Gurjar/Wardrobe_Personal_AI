'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Crown,
  Heart,
  LogOut,
  Settings,
  ShoppingBag,
  User,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { UserAvatar } from '@/components/shared/user-avatar';
import { useLogoutMutation } from '@/features/auth/hooks/use-logout-mutation';
import { cn } from '@/utils/cn';

const MENU_ITEMS = [
  { label: 'My Profile', href: ROUTES.PROFILE.HOME, icon: User },
  { label: 'Account Settings', href: ROUTES.PROFILE.SETTINGS, icon: Settings },
  { label: 'Orders', href: ROUTES.ORDERS, icon: ShoppingBag },
  { label: 'Wishlist', href: ROUTES.WISHLIST, icon: Heart },
];

export function DashboardProfileMenu({
  displayName,
  avatarUrl = null,
  planLabel = 'Premium Plan',
  triggerClassName,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const menuId = useId();
  const logoutMutation = useLogoutMutation();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        close();
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        close();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [close, open]);

  useEffect(() => {
    if (!open || !menuRef.current) {
      return undefined;
    }

    const menu = menuRef.current;
    const focusableSelector = 'a[href], button:not([disabled])';
    const focusable = Array.from(menu.querySelectorAll(focusableSelector));
    focusable[0]?.focus();

    function onKeyDown(event) {
      if (event.key !== 'Tab' || !focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    menu.addEventListener('keydown', onKeyDown);
    return () => menu.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const handleLogout = () => {
    close();
    logoutMutation.mutate();
  };

  const menuPanel = (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Profile menu"
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'absolute right-0 z-[70] mt-2.5 w-[min(calc(100vw-1.5rem),17.5rem)] overflow-hidden rounded-[18px]',
            'border border-white/[0.12] bg-[#0B1020]/88',
            'shadow-[0_24px_64px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)_inset]',
            'backdrop-blur-2xl',
          )}
        >
          <div className="border-b border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-transparent px-4 py-4">
            <div className="flex items-center gap-3">
              <UserAvatar name={displayName} src={avatarUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-dashboard-foreground">
                  {displayName}
                </p>
                <span
                  className={cn(
                    'mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5',
                    'border border-amber-400/25 bg-amber-400/10 text-[10px] font-semibold uppercase tracking-wide text-amber-200',
                  )}
                >
                  <Crown className="size-3" aria-hidden="true" />
                  {planLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="p-1.5">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={close}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-dashboard-foreground',
                    'transition-all duration-200',
                    'hover:-translate-y-px hover:bg-white/[0.07] hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-8 items-center justify-center rounded-lg',
                      'bg-white/[0.05] text-dashboard-muted ring-1 ring-white/[0.06]',
                      'transition-colors group-hover:bg-primary/15 group-hover:text-primary',
                    )}
                  >
                    <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-white/[0.08] p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-300',
                'transition-all duration-200 hover:-translate-y-px hover:bg-red-500/10',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40',
                'disabled:opacity-60',
              )}
            >
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg',
                  'bg-red-500/10 text-red-300 ring-1 ring-red-500/20',
                )}
              >
                <LogOut className="size-4" aria-hidden="true" />
              </span>
              {logoutMutation.isPending ? 'Logging out…' : 'Logout'}
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'group shrink-0 rounded-full',
          'transition-transform duration-200 hover:scale-105 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-bg',
          open && 'ring-2 ring-primary/30 ring-offset-2 ring-offset-dashboard-bg',
          triggerClassName,
        )}
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
      >
        <UserAvatar
          name={displayName}
          src={avatarUrl}
          size="sm"
          alt={`${displayName} profile`}
        />
      </button>

      {menuPanel}
    </div>
  );
}
