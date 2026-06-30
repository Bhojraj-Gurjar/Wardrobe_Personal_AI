import { Suspense } from 'react';
import { SearchResultsView } from '@/features/search/components/search-results-view';

export const metadata = {
  title: 'Search | Wardrobe AI',
};

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResultsView />
    </Suspense>
  );
}
