'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export function ProductBreadcrumb({ product }) {
  const category = product?.category || 'Products';

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-white/45">
      <Link href={ROUTES.PRODUCTS.LIST} className="transition hover:text-[#C4B5FD]">
        Products
      </Link>
      <ChevronRight className="size-3.5" aria-hidden="true" />
      <span className="text-white/55">{category}</span>
      <ChevronRight className="size-3.5" aria-hidden="true" />
      <span className="truncate font-medium text-white/80">{product?.name}</span>
    </nav>
  );
}
