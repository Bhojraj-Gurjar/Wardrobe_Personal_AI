import { cn } from '@/utils/cn';

export function PageContainer({
  children,
  className,
  title,
  description,
  actions,
}) {
  return (
    <section className={cn('w-full', className)}>
      {(title || description || actions) && (
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            {title ? (
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
            ) : null}
            {description ? (
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}
