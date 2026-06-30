'use client';

import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { ProductCardImage } from '@/features/products/components/product-card-image';
import {
  getProductImageUrl,
  normalizeMatchScore,
} from '@/features/products/utils/product-catalog.utils';
import { cn } from '@/utils/cn';
import { RECOMMENDATION_TAG_STYLES } from '../constants/recommendations.constants';

export function RecommendationOutfitCard({
  product,
  matchScore,
  tag,
  className,
}) {
  const imageUrl = getProductImageUrl(product);
  const matchPercent = normalizeMatchScore(matchScore);
  const productHref = product?.id
    ? ROUTES.PRODUCTS.DETAIL(product.id)
    : ROUTES.PRODUCTS.LIST;

  return (
    <Link
      href={productHref}
      className={cn(
        'interactive-card group block overflow-hidden rounded-2xl border border-white/[0.08]',
        'bg-[#121820] shadow-lg shadow-black/20',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1A2235]">
        <ProductCardImage
          src={imageUrl}
          alt={product?.name || 'Recommended outfit'}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          imageClassName="transition-transform duration-500 group-hover:scale-[1.04]"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

        {tag ? (
          <span
            className={cn(
              'absolute left-4 top-4 z-10 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md',
              RECOMMENDATION_TAG_STYLES[tag.tone] || RECOMMENDATION_TAG_STYLES.purple,
            )}
          >
            {tag.label}
          </span>
        ) : null}

        {matchPercent != null ? (
          <span className="absolute bottom-4 left-4 z-10 rounded-full bg-[#22C55E]/92 px-3 py-1.5 text-xs font-semibold text-white shadow-md">
            {matchPercent}% match
          </span>
        ) : null}
      </div>
    </Link>
  );
}
