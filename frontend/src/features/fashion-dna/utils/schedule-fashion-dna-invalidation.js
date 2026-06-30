import {
  FASHION_DNA_HISTORY_QUERY_KEY,
  FASHION_DNA_QUERY_KEY,
} from '@/features/fashion-dna/hooks/use-fashion-dna';

const INVALIDATION_DELAY_MS = 5000;

let queryClientRef = null;
let debounceTimer = null;

export function bindFashionDnaQueryClient(queryClient) {
  queryClientRef = queryClient;
}

export function scheduleFashionDnaInvalidation() {
  if (!queryClientRef) {
    return;
  }

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    queryClientRef.invalidateQueries({ queryKey: FASHION_DNA_QUERY_KEY });
    queryClientRef.invalidateQueries({ queryKey: FASHION_DNA_HISTORY_QUERY_KEY });
  }, INVALIDATION_DELAY_MS);
}
