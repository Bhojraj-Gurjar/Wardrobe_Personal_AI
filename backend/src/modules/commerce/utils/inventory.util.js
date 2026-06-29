export const STOCK_EXCEEDED_ERROR = {
  success: false,
  message: 'Requested quantity exceeds available stock.',
};

export class StockExceededError extends Error {
  constructor() {
    super(STOCK_EXCEEDED_ERROR.message);
    this.name = 'StockExceededError';
    this.payload = STOCK_EXCEEDED_ERROR;
  }
}

export function aggregateRequestedQuantities(items = []) {
  const totals = new Map();

  for (const item of items) {
    const productId = item?.product_id;
    const quantity = Number(item?.quantity ?? 0);

    if (!productId || !Number.isFinite(quantity) || quantity < 1) {
      continue;
    }

    totals.set(productId, (totals.get(productId) || 0) + quantity);
  }

  return totals;
}

export function resolveProductAvailableStock(product) {
  if (!product) {
    return 0;
  }

  const variants = product.variants || [];

  if (variants.length) {
    return variants.reduce((sum, variant) => sum + Number(variant.stock ?? 0), 0);
  }

  return Number(product.stock_quantity ?? 0);
}
