'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { PDP_CARD_CLASS } from '../../styles/product-details-tokens';

export function FeatureList({ product }) {
  const [expanded, setExpanded] = useState(false);
  const description = product?.description || 'Crafted for modern wardrobes with premium materials and a tailored silhouette.';
  const features = [
    product?.fabric && { label: 'Fabric', value: product.fabric },
    product?.fitType && { label: 'Fit', value: product.fitType || product.fit_type },
    product?.material && { label: 'Material', value: product.material },
    product?.pattern && { label: 'Pattern', value: product.pattern },
    product?.season && { label: 'Season', value: product.season },
  ].filter(Boolean);

  const preview = description.length > 180 ? `${description.slice(0, 180)}…` : description;

  return (
    <div className={`${PDP_CARD_CLASS} space-y-4 p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">About this piece</h2>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#C4B5FD] transition hover:text-white"
        >
          {expanded ? 'Show less' : 'Read more'}
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      <p className="text-sm leading-7 text-white/65">
        {expanded ? description : preview}
      </p>

      {features.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/35">
                {feature.label}
              </p>
              <p className="mt-1 text-sm font-medium text-white/80">{feature.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
