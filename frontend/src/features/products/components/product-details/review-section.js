'use client';

import { Star } from 'lucide-react';
import { buildRatingBreakdown } from '../../utils/product-details.utils';
import { PDP_CARD_CLASS } from '../../styles/product-details-tokens';

function ReviewCard({ author, rating, body, verified = true }) {
  return (
    <article className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{author}</p>
          {verified ? (
            <p className="text-[11px] uppercase tracking-wide text-emerald-300/80">Verified purchase</p>
          ) : null}
        </div>
        <div className="flex items-center gap-1 text-amber-300">
          <Star className="size-4 fill-current" />
          <span className="text-sm font-semibold">{rating}</span>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/65">{body}</p>
    </article>
  );
}

export function ReviewSection({ product }) {
  const rating = product?.rating ?? product?.average_rating ?? 4.6;
  const reviewCount = product?.reviewCount ?? product?.review_count ?? 128;
  const breakdown = buildRatingBreakdown(rating, reviewCount);

  const sampleReviews = [
    {
      author: 'Aisha M.',
      rating: 5,
      body: 'The fit is sharp and the fabric feels premium. Exactly what I expected from the AI styling recommendation.',
    },
    {
      author: 'Daniel R.',
      rating: 4,
      body: 'Beautiful silhouette and true-to-size. Delivery was fast and packaging felt elevated.',
    },
    {
      author: 'Maya K.',
      rating: 5,
      body: 'Loved pairing this with the virtual try-on preview before buying. Instant add-to-closet worthy.',
    },
  ];

  return (
    <section className={`${PDP_CARD_CLASS} space-y-6 p-6`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C4B5FD]">Customer Reviews</p>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-4xl font-bold text-white">{rating}</span>
            <span className="pb-1 text-sm text-white/50">{reviewCount} reviews</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {breakdown.map((row) => (
          <div key={row.stars} className="grid grid-cols-[2rem_1fr_3rem] items-center gap-3 text-sm">
            <span className="text-white/55">{row.stars}</span>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#6366F1]"
                style={{ width: `${row.percent}%` }}
              />
            </div>
            <span className="text-right text-white/35">{row.percent}%</span>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {sampleReviews.map((review) => (
          <ReviewCard key={review.author} {...review} />
        ))}
      </div>
    </section>
  );
}
