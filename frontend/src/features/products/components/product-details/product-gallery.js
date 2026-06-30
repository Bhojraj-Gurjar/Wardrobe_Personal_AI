'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { resolveProductImageUrl } from '@/utils/product-image';
import { PDP_CARD_CLASS, PDP_MOTION } from '../../styles/product-details-tokens';

export function ProductGallery({ images = [], productName = 'Product' }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const galleryImages = images.length
    ? images
    : [{ url: null, alt: productName }];

  const activeImage = galleryImages[activeIndex] || galleryImages[0];
  const activeUrl = resolveProductImageUrl(activeImage?.url || activeImage);

  return (
    <div className={`${PDP_CARD_CLASS} overflow-hidden`}>
      <div className="relative aspect-[4/5] max-h-[650px] w-full bg-[#0B1020]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeUrl || activeIndex}
            {...PDP_MOTION.fade}
            className="absolute inset-0"
          >
            {activeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeUrl}
                alt={activeImage?.alt || productName}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#111827] to-[#0B1020] text-5xl font-bold text-white/10">
                {productName?.[0] || '?'}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {galleryImages.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto border-t border-white/[0.06] p-4">
          {galleryImages.map((image, index) => {
            const thumbUrl = resolveProductImageUrl(image?.url || image);

            return (
              <button
                key={`${thumbUrl || 'placeholder'}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`View image ${index + 1}`}
                className={cn(
                  'relative size-20 shrink-0 overflow-hidden rounded-2xl border transition',
                  activeIndex === index
                    ? 'border-[#8B5CF6] ring-2 ring-[#8B5CF6]/30'
                    : 'border-white/[0.08] hover:border-[#8B5CF6]/35',
                )}
              >
                {thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center bg-white/[0.04] text-sm text-white/40">
                    {index + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
