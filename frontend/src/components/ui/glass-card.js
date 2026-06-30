import { cn } from '@/utils/cn';

export function GlassCard({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-white/10 bg-[#111827]/95 shadow-xl backdrop-blur-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassCardHeader({ className, children, ...props }) {
  return (
    <div className={cn('space-y-1', className)} {...props}>
      {children}
    </div>
  );
}

export function GlassCardTitle({ className, children, ...props }) {
  return (
    <h2
      className={cn('text-xl font-semibold tracking-tight text-dashboard-foreground', className)}
      {...props}
    >
      {children}
    </h2>
  );
}

export function GlassCardDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-sm text-dashboard-muted', className)} {...props}>
      {children}
    </p>
  );
}

export function GlassCardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-6 sm:p-8', className)} {...props}>
      {children}
    </div>
  );
}
