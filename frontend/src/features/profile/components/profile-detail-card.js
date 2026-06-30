import { cn } from '@/utils/cn';
import { formInputClass } from '@/components/ui/form-control-styles';

export function ProfileDetailCard({
  id,
  title,
  description,
  action,
  footer,
  children,
  className,
  divided = true,
  contentClassName,
}) {
  return (
    <section
      id={id}
      className={cn(
        'interactive-card rounded-2xl border border-white/[0.08] bg-[#121820] p-5 sm:p-6',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-dashboard-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-dashboard-muted">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div
        className={cn(
          description ? 'mt-5' : 'mt-5',
          divided && 'divide-y divide-white/[0.06]',
          contentClassName,
        )}
      >
        {children}
      </div>

      {footer ? (
        <div className="mt-5 border-t border-white/[0.06] pt-5">{footer}</div>
      ) : null}
    </section>
  );
}

export function ProfileDetailRow({ label, children, value, className }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0',
        className,
      )}
    >
      <span className="shrink-0 text-sm text-dashboard-muted">{label}</span>
      {children ?? (
        <span className="max-w-[65%] truncate text-right text-sm font-semibold text-dashboard-foreground">
          {value || '—'}
        </span>
      )}
    </div>
  );
}

export function ProfileFieldGroup({
  title,
  description,
  hint,
  children,
  className,
}) {
  return (
    <section className={cn('space-y-3 py-5 first:pt-0 last:pb-0', className)}>
      <div>
        {title ? (
          <h3 className="text-sm font-semibold text-dashboard-foreground">{title}</h3>
        ) : null}
        {description ? (
          <p className="mt-0.5 text-xs text-dashboard-muted">{description}</p>
        ) : null}
        {hint ? (
          <p className="mt-1 text-xs text-dashboard-muted">{hint}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function ProfileSaveFooter({ children, className }) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center', className)}>
      {children}
    </div>
  );
}

export const PROFILE_DETAIL_FIELD_CLASS = cn(
  'h-8 w-full max-w-[220px] border-0 bg-transparent px-0 text-right text-sm font-semibold',
  'text-dashboard-foreground shadow-none placeholder:font-normal placeholder:text-dashboard-muted/70',
  'focus-visible:ring-0 focus-visible:ring-offset-0',
);

export const PROFILE_DETAIL_SELECT_CLASS = cn(
  PROFILE_DETAIL_FIELD_CLASS,
  'cursor-pointer appearance-none pr-1',
);

export const PROFILE_FORM_INPUT_CLASS = formInputClass;

export function ProfileToggleRow({ label, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#0d1117] px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-dashboard-foreground">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-dashboard-muted">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          checked ? 'bg-primary' : 'bg-white/10',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          className={cn(
            'inline-block size-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  );
}
