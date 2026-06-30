'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { ROUTES } from '@/constants/routes';
import { BODY_DASHBOARD_CARD_CLASS } from '../constants/body-analysis-dashboard';

function RecommendationItem({ item }) {
  if (typeof item === 'string') {
    return (
      <li className="text-sm text-dashboard-muted">{item}</li>
    );
  }

  return (
    <li className="rounded-xl border border-white/6 bg-[#12182A]/70 px-3 py-2.5 text-left">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-dashboard-foreground">{item.name}</p>
        {item.confidence ? (
          <span className="shrink-0 rounded-full bg-[#8B5CF6]/20 px-2 py-0.5 text-[10px] font-semibold text-[#C4B5FD]">
            {Math.round(item.confidence)}% Match
          </span>
        ) : null}
      </div>
      {item.reason ? (
        <p className="mt-1 text-xs leading-relaxed text-dashboard-muted">{item.reason}</p>
      ) : null}
    </li>
  );
}

function ProductChip({ product }) {
  return (
    <Link
      href={ROUTES.PRODUCTS.DETAIL(product.id)}
      className="flex items-center gap-2 rounded-xl border border-white/8 bg-[#12182A]/80 px-2.5 py-2 transition-colors hover:border-[#8B5CF6]/30"
    >
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt=""
          className="size-10 rounded-lg object-cover"
        />
      ) : (
        <span className="flex size-10 items-center justify-center rounded-lg bg-white/5 text-[10px] text-dashboard-muted">
          Fit
        </span>
      )}
      <div className="min-w-0 text-left">
        <p className="truncate text-xs font-medium text-dashboard-foreground">{product.name}</p>
        {product.matchConfidence ? (
          <p className="text-[10px] text-[#C4B5FD]">{Math.round(product.matchConfidence)}% match</p>
        ) : null}
      </div>
    </Link>
  );
}

export function PersonalizedFitGuide({ fitGuide = [], hasAnalysis = false, className }) {
  if (!hasAnalysis) {
    return null;
  }

  const visibleItems = fitGuide.filter((item) => !item.isEmpty);

  if (!visibleItems.length) {
    return null;
  }

  return (
    <section className={cn('space-y-4', className)}>
      <div className="space-y-1">
        <h3 className="text-xl font-semibold text-dashboard-foreground">
          Personalised Fit Guide
        </h3>
        <p className="text-sm text-dashboard-muted">
          Generated from your body type, measurements, and proportions — not generic templates.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const recommendations = item.recommendations || [];
          const richItems = recommendations.filter(
            (entry) => typeof entry === 'object' && entry?.name,
          );

          return (
            <Card
              key={item.id}
              className={cn(
                BODY_DASHBOARD_CARD_CLASS,
                'border-white/6 bg-[#171D31] transition-colors hover:border-[#8B5CF6]/25',
              )}
            >
              <CardContent className="flex h-full flex-col px-5 py-6">
                <div className="mb-4 flex flex-col items-center text-center">
                  <div
                    className={cn(
                      'mb-4 flex size-14 items-center justify-center rounded-2xl',
                      item.iconClass,
                    )}
                  >
                    <Icon className="size-7" aria-hidden="true" />
                  </div>
                  <h4 className="text-base font-semibold text-white">{item.title}</h4>
                  {item.why ? (
                    <p className="mt-2 text-xs leading-relaxed text-violet-300/85">{item.why}</p>
                  ) : null}
                </div>

                {richItems.length ? (
                  <ul className="space-y-2">
                    {richItems.slice(0, 3).map((entry) => (
                      <RecommendationItem key={entry.name} item={entry} />
                    ))}
                  </ul>
                ) : item.recommendation ? (
                  <p className="text-center text-sm leading-relaxed text-dashboard-muted">
                    {item.recommendation}
                  </p>
                ) : null}

                {item.avoid?.length ? (
                  <div className="mt-4 border-t border-white/6 pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-300/90">
                      Avoid
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {item.avoid.slice(0, 2).map((avoidItem) => (
                        <li key={avoidItem} className="text-xs text-dashboard-muted">
                          {avoidItem}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {item.products?.length ? (
                  <div className="mt-4 border-t border-white/6 pt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#C4B5FD]">
                      Recommended for You
                    </p>
                    <div className="space-y-2">
                      {item.products.slice(0, 2).map((product) => (
                        <ProductChip key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
