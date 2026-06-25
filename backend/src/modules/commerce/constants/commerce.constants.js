export const COUPON_CODES = {
  WELCOME10: { percent: 10, label: '10% off' },
  WARDROBE20: { percent: 20, label: '20% off' },
  SUMMER15: { percent: 15, label: '15% off' },
};

export const SHIPPING_FLAT_INR = 99;
export const FREE_SHIPPING_MIN_INR = 2999;
export const ESTIMATED_DELIVERY_LABEL = '3–7 business days';
export const DEFAULT_COUNTRY = 'India';

export function validateCouponCode(code) {
  if (!code) {
    return null;
  }

  const normalized = String(code).trim().toUpperCase();
  const coupon = COUPON_CODES[normalized];

  if (!coupon) {
    return null;
  }

  return { code: normalized, ...coupon };
}

export function calculateCartTotals(items = [], couponCode = null) {
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  );

  const coupon = validateCouponCode(couponCode);
  const discount = coupon
    ? Math.round((subtotal * (coupon.percent / 100)) * 100) / 100
    : 0;

  const shipping = subtotal - discount >= FREE_SHIPPING_MIN_INR || subtotal === 0
    ? 0
    : SHIPPING_FLAT_INR;

  const total = Math.max(0, Math.round((subtotal - discount + shipping) * 100) / 100);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    shipping,
    discount,
    total,
    appliedCoupon: coupon?.code || null,
    couponLabel: coupon?.label || null,
    estimatedDelivery: ESTIMATED_DELIVERY_LABEL,
    freeShippingThreshold: FREE_SHIPPING_MIN_INR,
    qualifiesForFreeShipping: subtotal - discount >= FREE_SHIPPING_MIN_INR,
  };
}

export function generateOrderNumber() {
  const year = new Date().getFullYear();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `WA-${year}-${suffix}`;
}
