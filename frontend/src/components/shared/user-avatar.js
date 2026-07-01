'use client';

import { useEffect, useState } from 'react';
import { getUserDisplayInitials } from '@/features/profile/utils/profile-helpers';
import { cn } from '@/utils/cn';

const SIZE_CLASSES = {
  sm: 'size-10 text-xs md:size-11 md:text-sm',
  md: 'size-11 text-sm md:size-12 md:text-base',
  lg: 'size-14 text-base md:size-16 md:text-lg',
};

export function UserAvatar({
  name,
  src = null,
  size = 'sm',
  className,
  imageClassName,
  alt,
  priority = false,
}) {
  const initials = getUserDisplayInitials(name);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(src) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#5B21B6]',
        'font-bold tracking-tight text-white',
        'border border-primary/35',
        'shadow-[0_4px_16px_rgba(124,58,237,0.28)]',
        'transition-[transform,box-shadow,border-color] duration-200',
        'motion-safe:group-hover:scale-[1.04]',
        'motion-safe:group-hover:shadow-[0_8px_24px_rgba(124,58,237,0.42)]',
        'motion-safe:group-hover:border-primary/55',
        'motion-safe:group-active:scale-[0.98]',
        SIZE_CLASSES[size] ?? SIZE_CLASSES.sm,
        className,
      )}
      aria-hidden={showImage ? undefined : true}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt || `${name || 'User'} profile photo`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={cn('size-full object-cover', imageClassName)}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}
