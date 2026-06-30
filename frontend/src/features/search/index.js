export { GlobalSearchDropdown } from './components/global-search-dropdown';
export { SearchHighlight } from './components/search-highlight';
export { SearchResultsView } from './components/search-results-view';
export {
  rememberSearchQuery,
  useClearSearchHistory,
  useMergedRecentSearches,
  useSearchHistoryQuery,
  useSearchSuggestions,
} from './hooks/use-global-search';
export { useSearchResultsQuery } from './hooks/use-search-results';
export {
  fetchSearchHistory,
  fetchSearchResults,
  fetchSearchSuggestions,
} from './services/global-search.service';
export {
  buildBrandUrl,
  buildCategoryUrl,
  buildCollectionUrl,
  buildSearchResultsUrl,
  buildStyleUrl,
} from './utils/search.utils';
