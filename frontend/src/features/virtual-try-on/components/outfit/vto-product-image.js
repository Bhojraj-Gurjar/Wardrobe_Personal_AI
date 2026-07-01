'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import {
  getProductImage,
  getProductInitials,
  PRODUCT_IMAGE_PLACEHOLDER,
} from '@/utils/product-image';

export function VtoProductImage({
  product,
  alt,
  className,
  imageClassName,
  debug = false,
}) {
  const imageSrc = getProductImage(product, { debug });
  const hasRealImage = Boolean(imageSrc) && imageSrc !== PRODUCT_IMAGE_PLACEHOLDER;
  const [isLoading, setIsLoading] = useState(hasRealImage);
  const [hasError, setHasError] = useState(false);
  const showInitials = !hasRealImage || hasError;

  useEffect(() => {
    setHasError(false);
    setIsLoading(hasRealImage);
  }, [imageSrc, hasRealImage]);

  return (
    <div className={cn('relative size-full overflow-hidden', className)}>
      {isLoading ? (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent" />
      ) : null}

      {showInitials ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1E1635] via-[#141B2D] to-[#0B1020]">
          <span className="text-2xl font-semibold tracking-wide text-white/70">
            {getProductInitials(product)}
          </span>
        </div>
      ) : (
        /* Native img avoids Next.js /_next/image proxy failures for remote + SVG URLs. */
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageSrc}
          alt={alt || product?.name || 'Product'}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={cn(
            'size-full object-cover transition-opacity duration-500',
            isLoading ? 'opacity-0' : 'opacity-100',
            imageClassName,
          )}
          onLoad={() => {
            setIsLoading(false);
            if (process.env.NODE_ENV === 'development' && debug) {
              console.debug('[vto-product-image] loaded', {
                productId: product?.id,
                src: imageSrc,
              });
            }
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
            if (process.env.NODE_ENV === 'development') {
              console.warn('[vto-product-image] failed', {
                productId: product?.id,
                src: imageSrc,
              });
            }
          }}
        />
      )}
    </div>
  );
}
