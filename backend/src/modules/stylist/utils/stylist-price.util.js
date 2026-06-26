const USD_TO_INR = 83;

export function formatStylistPrice(price, currency = 'USD') {
  const value = Math.round(Number(price) || 0);
  if (currency === 'INR') {
    return `₹${value.toLocaleString('en-IN')}`;
  }
  if (currency === 'USD') {
    return `$${value.toLocaleString('en-US')}`;
  }
  return `${value} ${currency}`;
}

export function priceWithinBudget(product, maxBudgetInr) {
  if (!maxBudgetInr || maxBudgetInr <= 0) {
    return true;
  }

  const price = Number(product.price) || 0;
  const currency = product.currency || 'USD';

  if (currency === 'INR') {
    return price <= maxBudgetInr;
  }

  return price * USD_TO_INR <= maxBudgetInr;
}

export function sumProductPrices(products) {
  return products.reduce((sum, product) => {
    const price = Number(product.price) || 0;
    const currency = product.currency || 'USD';
    const inr = currency === 'INR' ? price : price * USD_TO_INR;
    return sum + inr;
  }, 0);
}
