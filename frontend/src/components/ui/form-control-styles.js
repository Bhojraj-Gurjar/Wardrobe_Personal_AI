import { cn } from '@/utils/cn';

/** Shared premium form control styles for the Wardrobe AI dashboard theme. */
export const formControlBaseClass = cn(
  'w-full rounded-xl border border-dashboard-border bg-dashboard-surface',
  'px-4 py-3 text-base font-medium text-dashboard-foreground',
  'placeholder:text-slate-500',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
  'transition-all duration-300 ease-out',
  'hover:border-white/[0.14] hover:bg-dashboard-surface-elevated/90',
  'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-purple-500/20',
  'focus-visible:shadow-[0_0_20px_rgba(139,92,246,0.12)]',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'aria-[invalid=true]:border-red-500/50 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-500/20',
);

export const formInputClass = cn(formControlBaseClass, 'flex h-12 text-sm');

export const formTextareaClass = cn(
  formControlBaseClass,
  'form-control-scrollbar min-h-[160px] resize-y py-3 text-sm leading-relaxed',
);

export const formSelectClass = cn(
  formInputClass,
  'cursor-pointer appearance-none pr-10',
);

export const formCheckboxClass = cn(
  'size-4 shrink-0 rounded border-dashboard-border bg-dashboard-surface',
  'text-primary accent-primary',
  'transition-colors duration-300',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0',
);

export const formLabelClass = 'text-sm font-medium text-dashboard-muted';
