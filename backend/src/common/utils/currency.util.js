export const DEFAULT_CURRENCY = 'INR';
export const CURRENCY_SYMBOL = '₹';
export const LEGACY_USD_TO_INR = 83;

export function normalizeCurrencyCode(currency) {
  if (!currency || currency === 'USD') {
    return DEFAULT_CURRENCY;
  }

  return currency;
}

export function formatCurrency(amount, currency = DEFAULT_CURRENCY) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return `${CURRENCY_SYMBOL}0`;
  }

  const resolved = normalizeCurrencyCode(currency);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: resolved,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatCurrencyRange(min, max, currency = DEFAULT_CURRENCY) {
  return `${formatCurrency(min, currency)} – ${formatCurrency(max, currency)}`;
}

export function toInrAmount(amount, currency = DEFAULT_CURRENCY) {
  const value = Number(amount) || 0;

  if (normalizeCurrencyCode(currency) === DEFAULT_CURRENCY) {
    return Math.round(value);
  }

  return Math.round(value * LEGACY_USD_TO_INR);
}

export function priceWithinInrBudget(product, maxBudgetInr) {
  if (!maxBudgetInr || maxBudgetInr <= 0) {
    return true;
  }

  const price = Number(product?.price) || 0;
  return toInrAmount(price, product?.currency) <= maxBudgetInr;
}

export function sumProductPricesInr(products = []) {
  return products.reduce(
    (sum, product) => sum + toInrAmount(product?.price, product?.currency),
    0,
  );
}
