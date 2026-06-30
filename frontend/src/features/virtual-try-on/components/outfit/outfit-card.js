'use client';



import { memo } from 'react';

import { Check } from 'lucide-react';

import { formatProductPrice } from '@/features/products/utils/product-catalog.utils';
import { cn } from '@/utils/cn';
import { TRY_ON_SLOT_LABELS } from '../../utils/outfit-selection.util';
import { VTO_TRANSITION } from '../../styles/virtual-try-on-tokens';
import { VtoProductImage } from './vto-product-image';

export const OutfitCard = memo(function OutfitCard({
  product,
  isSelected,
  onSelect,
}) {
  const isCompatible = product.isTryOnCompatible !== false;
  const slotLabel = product.tryOnSlot ? TRY_ON_SLOT_LABELS[product.tryOnSlot] : null;



  return (

    <button

      type="button"

      onClick={() => onSelect(product)}

      disabled={!isCompatible}

      aria-pressed={isSelected}

      aria-label={`Select ${product.name} by ${product.brand}`}

      className={cn(

        'group relative w-[140px] shrink-0 snap-start overflow-hidden rounded-2xl border text-left',

        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141B2D]',

        VTO_TRANSITION,

        isSelected

          ? 'border-2 border-[#7C3AED] shadow-[0_0_24px_rgba(124,58,237,0.45)] ring-2 ring-[#A855F7]/60'

          : 'border border-white/[0.08] hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]',

        !isCompatible && 'cursor-not-allowed opacity-50',

      )}

    >

      <div className="relative aspect-[3/4] overflow-hidden bg-black/40">

        <VtoProductImage

          product={product}

          alt={product.name}

          debug={process.env.NODE_ENV === 'development'}

          imageClassName="transition-transform duration-300 group-hover:scale-105"

        />



        {slotLabel ? (
          <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/75">
            {slotLabel}
          </span>
        ) : null}

        {isSelected ? (

          <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-[#7C3AED] text-white shadow-lg">

            <Check className="size-3.5" aria-hidden="true" />

          </span>

        ) : null}



        {!isCompatible ? (

          <span className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-center text-[10px] text-white/70">

            Not compatible

          </span>

        ) : null}

      </div>



      <div className="space-y-0.5 p-2.5">

        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-white/45">

          {product.brand}

        </p>

        <p className="line-clamp-2 text-xs font-semibold leading-tight text-white">

          {product.name}

        </p>

        <p className="text-xs font-bold text-[#A855F7]">

          {formatProductPrice(product.price, product.currency)}

        </p>

      </div>

    </button>

  );

});

