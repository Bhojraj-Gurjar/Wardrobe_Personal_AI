'use client';

import { formatProductPrice } from '../../utils/product-catalog.utils';
import { deriveDiscountPercent, deriveEmiLabel } from '../../utils/product-details.utils';
import { PDP_CARD_CLASS } from '../../styles/product-details-tokens';

export function ProductPrice({ product }) {
  const price = formatProductPrice(product?.price, product?.currency);
  const compareAt = formatProductPrice(
    product?.compareAtPrice ?? product?.compare_at_price ?? product?.mrp,
    product?.currency,
  );
  const discount = deriveDiscountPercent(product?.price, product?.compareAtPrice ?? product?.mrp);
  const emi = deriveEmiLabel(product?.price, product?.currency);
  const taxPercent = product?.taxPercent ?? product?.tax_percent;

  return (
    <div className={`${PDP_CARD_CLASS} space-y-3 p-5`}>
      <div className="flex flex-wrap items-end gap-3">
        <span className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{price}</span>
        {compareAt && compareAt !== price ? (
          <span className="text-lg text-white/35 line-through">{compareAt}</span>
        ) : null}
        {discount ? (
          <span className="rounded-full bg-red-500/15 px-3 py-1 text-sm font-semibold text-red-300">
            {discount}% off
          </span>
        ) : null}
      </div>

      {emi ? <p className="text-sm text-white/55">{emi}</p> : null}
      {taxPercent != null ? (
        <p className="text-xs text-white/40">Inclusive of {taxPercent}% tax where applicable</p>
      ) : null}
    </div>
  );
}
