import { cn } from '@/utils/cn';

export function Checkbox({ className, label, id, ...props }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <input
        type="checkbox"
        id={id}
        className={cn(
          'size-4 shrink-0 rounded border border-auth-input-border bg-auth-input-bg',
          'accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
        {...props}
      />
      {label ? (
        <label
          htmlFor={id}
          className="cursor-pointer text-sm font-normal text-auth-panel-foreground/90"
        >
          {label}
        </label>
      ) : null}
    </div>
  );
}
