import {
  DEFAULT_CURRENCY,
  formatCurrency,
  priceWithinInrBudget,
  sumProductPricesInr,
} from '../../../common/utils/currency.util';

export function formatStylistPrice(price, currency = DEFAULT_CURRENCY) {
  return formatCurrency(price, currency);
}

export function priceWithinBudget(product, maxBudgetInr) {
  return priceWithinInrBudget(product, maxBudgetInr);
}

export function sumProductPrices(products) {
  return sumProductPricesInr(products);
}
