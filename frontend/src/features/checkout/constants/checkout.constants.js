export const PAYMENT_METHODS = [
  { id: 'COD', label: 'Cash On Delivery', description: 'Pay when your order arrives' },
  { id: 'UPI', label: 'UPI', description: 'Google Pay, PhonePe, Paytm (simulated)' },
  { id: 'CREDIT_CARD', label: 'Credit Card', description: 'Visa, Mastercard, Amex (gateway ready)' },
  { id: 'DEBIT_CARD', label: 'Debit Card', description: 'Domestic debit cards (gateway ready)' },
  { id: 'NET_BANKING', label: 'Net Banking', description: 'All major banks (gateway ready)' },
  { id: 'WALLET', label: 'Wallet', description: 'Paytm, Amazon Pay (gateway ready)' },
];

export const ADDRESS_TYPES = [
  { id: 'HOME', label: 'Home' },
  { id: 'OFFICE', label: 'Office' },
  { id: 'OTHER', label: 'Other' },
];

export const CHECKOUT_STEPS = [
  { id: 'address', label: 'Shipping' },
  { id: 'payment', label: 'Payment' },
  { id: 'review', label: 'Review' },
];

export const OMS_TABS = [
  { id: 'NEW_ORDERS', label: 'New Orders', status: 'PENDING' },
  { id: 'ACCEPTED', label: 'Accepted', status: 'ACCEPTED' },
  { id: 'PACKED_RTD', label: 'Packed / RTD', status: 'PACKED_RTD' },
  { id: 'IN_TRANSIT', label: 'In Transit', status: 'IN_TRANSIT' },
  { id: 'COMPLETED', label: 'Completed', status: 'COMPLETED' },
  { id: 'CANCELLED', label: 'Cancelled', status: 'CANCELLED' },
  { id: 'RETURNED', label: 'Returned', status: 'RETURNED' },
  { id: 'REFUNDED', label: 'Refunded', status: 'REFUNDED' },
  { id: 'ARCHIVED', label: 'Archived', status: 'ARCHIVED' },
];

/** Summary cards — clicking filters the orders table by tab id */
export const OMS_STAGE_CARDS = [
  { id: 'NEW_ORDERS', title: 'New Orders', metricKey: 'new_orders', emoji: '🆕' },
  { id: 'ACCEPTED', title: 'Accepted', metricKey: 'accepted', emoji: '✅' },
  { id: 'PACKED_RTD', title: 'Packed / RTD', metricKey: 'packed_rtd', emoji: '📦' },
  { id: 'IN_TRANSIT', title: 'In Transit', metricKey: 'in_transit', emoji: '🚛' },
  { id: 'COMPLETED', title: 'Completed', metricKey: 'completed', emoji: '🎉' },
  { id: 'TODAY_REVENUE', title: "Today's Revenue", metricKey: 'today_revenue', emoji: '💰', format: 'currency' },
];
