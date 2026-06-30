import { ROUTES } from '@/constants/routes';

const GUEST_SEARCH_HISTORY_KEY = 'wardrobe-recent-searches';
const MAX_GUEST_SEARCHES = 10;

export function buildSearchResultsUrl(query) {
  const normalized = String(query || '').trim();
  return normalized
    ? `${ROUTES.PRODUCTS.SEARCH}?q=${encodeURIComponent(normalized)}`
    : ROUTES.PRODUCTS.SEARCH;
}

export function buildBrandUrl(brand) {
  return ROUTES.PRODUCTS.BY_BRAND(brand);
}

export function buildCategoryUrl(category) {
  return ROUTES.PRODUCTS.BY_CATEGORY(category);
}

export function buildCollectionUrl(collection) {
  return ROUTES.PRODUCTS.BY_COLLECTION(collection);
}

export function buildStyleUrl(style) {
  return buildSearchResultsUrl(style);
}

export function readGuestSearchHistory() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(GUEST_SEARCH_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, MAX_GUEST_SEARCHES) : [];
  } catch {
    return [];
  }
}

export function writeGuestSearchHistory(items) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      GUEST_SEARCH_HISTORY_KEY,
      JSON.stringify(items.slice(0, MAX_GUEST_SEARCHES)),
    );
  } catch {
    // ignore storage failures
  }
}

export function appendGuestSearchHistory(query) {
  const normalized = String(query || '').trim();
  if (!normalized) {
    return readGuestSearchHistory();
  }

  const current = readGuestSearchHistory().filter(
    (item) => item.toLowerCase() !== normalized.toLowerCase(),
  );

  const next = [normalized, ...current].slice(0, MAX_GUEST_SEARCHES);
  writeGuestSearchHistory(next);
  return next;
}

export function clearGuestSearchHistory() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(GUEST_SEARCH_HISTORY_KEY);
  } catch {
    // ignore storage failures
  }
}

export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function splitHighlightParts(text, query) {
  const source = String(text || '');
  const term = String(query || '').trim();

  if (!term) {
    return [{ text: source, match: false }];
  }

  const regex = new RegExp(`(${escapeRegExp(term)})`, 'ig');
  return source
    .split(regex)
    .filter(Boolean)
    .map((part) => ({
      text: part,
      match: part.toLowerCase() === term.toLowerCase(),
    }));
}
