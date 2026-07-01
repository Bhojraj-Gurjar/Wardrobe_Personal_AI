'use client';

import { Loader2, LogOut } from 'lucide-react';
import { AUTH_CONTEXT } from '@/features/auth/constants/auth-context';
import { useLogoutMutation } from '@/features/auth/hooks/use-logout-mutation';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export function LogoutButton({
  collapsed = false,
  className,
  onNavigate,
  context = AUTH_CONTEXT.USER,
}) {
  const logoutMutation = useLogoutMutation(context);
  const isLoading = logoutMutation.isPending;

  const handleLogout = () => {
    onNavigate?.();
    logoutMutation.mutate();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      title={collapsed ? 'Logout' : undefined}
      disabled={isLoading}
      onClick={handleLogout}
      className={cn(
        'w-full text-dashboard-muted hover:bg-dashboard-surface-elevated',
        'hover:text-dashboard-foreground',
        collapsed ? 'justify-center px-2' : 'justify-start',
        className,
      )}
    >
      {isLoading ? (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="size-4 shrink-0" aria-hidden="true" />
      )}
      {!collapsed ? <span>Logout</span> : null}
    </Button>
  );
}
