import type { LucideIcon } from 'lucide-react';
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Flame,
  Percent,
  Star,
} from 'lucide-react';

export type ProductSortId =
  | 'best_match'
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'most_popular'
  | 'highest_rated'
  | 'discount';

export type ProductSortOption = {
  id: ProductSortId;
  label: string;
  description?: string;
  Icon: LucideIcon;
};

export const PRODUCT_SORT_OPTIONS: ProductSortOption[] = [
  { id: 'best_match', label: 'Best Match', Icon: Star },
  { id: 'price_asc', label: 'Price Low to High', Icon: ArrowUp },
  { id: 'price_desc', label: 'Price High to Low', Icon: ArrowDown },
  { id: 'newest', label: 'Newest', Icon: Clock },
  { id: 'most_popular', label: 'Most Popular', Icon: Flame },
  { id: 'highest_rated', label: 'Highest Rated', Icon: Star },
  { id: 'discount', label: 'Discount', description: 'Highest discount first', Icon: Percent },
];

export function getSortOption(id: string) {
  return PRODUCT_SORT_OPTIONS.find((option) => option.id === id) ?? PRODUCT_SORT_OPTIONS[0];
}
