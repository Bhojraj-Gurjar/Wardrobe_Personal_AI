export const DEFAULT_CURRENCY = 'INR';
export const CURRENCY_SYMBOL = '₹';

/** Normalize legacy / missing currency codes to INR for display. */
export function normalizeDisplayCurrency(currency) {
  if (!currency || currency === 'USD') {
    return DEFAULT_CURRENCY;
  }

  return currency;
}

/**
 * Format a monetary amount in Indian Rupees (en-IN locale).
 * Examples: ₹999, ₹1,499, ₹1,25,000
 */
export function formatCurrency(price, currency = DEFAULT_CURRENCY, options = {}) {
  if (price == null || Number.isNaN(Number(price))) {
    return null;
  }

  const resolvedCurrency = normalizeDisplayCurrency(currency);
  const value = Number(price);
  const maximumFractionDigits =
    options.maximumFractionDigits ?? (value % 1 === 0 ? 0 : 2);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: resolvedCurrency,
    maximumFractionDigits,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
  }).format(value);
}

export function formatProductPrice(price, currency = DEFAULT_CURRENCY) {
  return formatCurrency(price, currency);
}

/** Compact formatter for charts/tooltips (no currency style, Indian grouping). */
export function formatCurrencyCompact(price, currency = DEFAULT_CURRENCY) {
  if (price == null || Number.isNaN(Number(price))) {
    return null;
  }

  const resolvedCurrency = normalizeDisplayCurrency(currency);
  const value = Number(price);

  if (resolvedCurrency !== 'INR') {
    return formatCurrency(value, resolvedCurrency, { maximumFractionDigits: 0 });
  }

  if (value >= 100000) {
    return `${CURRENCY_SYMBOL}${(value / 100000).toFixed(value >= 1000000 ? 1 : 2)}L`;
  }

  if (value >= 1000) {
    return `${CURRENCY_SYMBOL}${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  }

  return `${CURRENCY_SYMBOL}${Math.round(value).toLocaleString('en-IN')}`;
}
