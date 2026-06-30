import { cn } from '@/utils/cn';

export function ProfileTraitGrid({ items, emptyMessage, isLoading, loadingMessage = 'Loading…' }) {
  if (isLoading) {
    return <p className="py-2 text-sm text-dashboard-muted">{loadingMessage}</p>;
  }

  if (!items?.length) {
    return (
      <p className="py-2 text-sm text-dashboard-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-white/[0.08] bg-[#0d1117] px-4 py-3"
        >
          <dt className="text-[11px] font-medium uppercase tracking-wide text-dashboard-muted">
            {item.label}
          </dt>
          <dd className="mt-1 text-sm font-semibold text-dashboard-foreground">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ProfileMediaPreview({ src, alt, fallbackIcon: FallbackIcon, className }) {
  return (
    <div
      className={cn(
        'mx-auto flex size-44 shrink-0 items-center justify-center overflow-hidden',
        'rounded-2xl border border-white/[0.08] bg-[#0d1117] lg:mx-0',
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : (
        <FallbackIcon className="size-14 text-dashboard-muted/60" aria-hidden="true" />
      )}
    </div>
  );
}
