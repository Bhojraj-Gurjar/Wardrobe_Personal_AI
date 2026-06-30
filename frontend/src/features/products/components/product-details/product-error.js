'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { PDP_CARD_CLASS } from '../../styles/product-details-tokens';

export function ProductError({ message, onRetry }) {
  return (
    <div className={`${PDP_CARD_CLASS} mx-auto max-w-xl p-10 text-center`}>
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-red-500/10 text-red-300">
        <AlertCircle className="size-8" />
      </div>
      <h2 className="text-2xl font-semibold text-white">Product unavailable</h2>
      <p className="mt-3 text-sm text-white/55">
        {message || 'We could not load this product right now.'}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#8B5CF6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7C3AED]"
          >
            <RefreshCw className="size-4" />
            Try again
          </button>
        ) : null}
        <Link
          href={ROUTES.PRODUCTS.LIST}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-[#8B5CF6]/40 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Browse products
        </Link>
      </div>
    </div>
  );
}
