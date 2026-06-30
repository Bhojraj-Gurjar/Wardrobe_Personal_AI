'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PRODUCT_PLACEHOLDER_SRC } from '@/features/products/constants/product-images';
import { cn } from '@/utils/cn';

export function ProductCardImage({
  src,
  alt,
  className,
  imageClassName,
  priority = false,
}) {
  const [resolvedSrc, setResolvedSrc] = useState(src || PRODUCT_PLACEHOLDER_SRC);
  const [isLoading, setIsLoading] = useState(Boolean(src));

  useEffect(() => {
    setResolvedSrc(src || PRODUCT_PLACEHOLDER_SRC);
    setIsLoading(Boolean(src));
  }, [src]);

  return (
    <div className={cn('relative size-full overflow-hidden', className)}>
      {isLoading ? (
        <Skeleton className="absolute inset-0 size-full rounded-none" />
      ) : null}

      {/* Native img avoids Next.js /_next/image proxy failures for remote + SVG URLs. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        className={cn('size-full object-cover', imageClassName)}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setResolvedSrc((current) =>
            current === PRODUCT_PLACEHOLDER_SRC ? current : PRODUCT_PLACEHOLDER_SRC,
          );
        }}
      />
    </div>
  );
}
