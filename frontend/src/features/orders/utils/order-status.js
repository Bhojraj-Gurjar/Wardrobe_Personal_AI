export const ORDER_STATUS_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'New' },
  { id: 'PROCESSING', label: 'Processing' },
  { id: 'IN_TRANSIT', label: 'In Transit' },
  { id: 'COMPLETED', label: 'Delivered' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export const ORDER_STATUS_CONFIG = {
  CREATED: { label: 'New Order', badgeClass: 'border-blue-500/30 bg-blue-500/10 text-blue-300', dotClass: 'bg-blue-400' },
  CONFIRMED: { label: 'Accepted', badgeClass: 'border-purple-500/30 bg-purple-500/10 text-purple-300', dotClass: 'bg-purple-400' },
  PACKING: { label: 'Packing', badgeClass: 'border-orange-500/30 bg-orange-500/10 text-orange-300', dotClass: 'bg-orange-400' },
  PACKED: { label: 'Packed', badgeClass: 'border-orange-500/30 bg-orange-500/10 text-orange-300', dotClass: 'bg-orange-400' },
  READY_TO_DISPATCH: { label: 'Packed / RTD', badgeClass: 'border-orange-500/30 bg-orange-500/10 text-orange-300', dotClass: 'bg-orange-400' },
  READY_FOR_HANDOVER: { label: 'In Transit', badgeClass: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300', dotClass: 'bg-indigo-400' },
  SHIPPED: { label: 'In Transit', badgeClass: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300', dotClass: 'bg-indigo-400' },
  DELIVERED: { label: 'Delivered', badgeClass: 'border-green-500/30 bg-green-500/10 text-green-300', dotClass: 'bg-green-400' },
  COMPLETED: { label: 'Delivered', badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', dotClass: 'bg-emerald-400' },
  CANCELLED: { label: 'Cancelled', badgeClass: 'border-red-500/30 bg-red-500/10 text-red-300', dotClass: 'bg-red-400' },
  RETURNED: { label: 'Returned', badgeClass: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300', dotClass: 'bg-yellow-400' },
  REFUNDED: { label: 'Refunded', badgeClass: 'border-pink-500/30 bg-pink-500/10 text-pink-300', dotClass: 'bg-pink-400' },
  ARCHIVED: { label: 'Archived', badgeClass: 'border-gray-500/30 bg-gray-500/10 text-gray-300', dotClass: 'bg-gray-400' },
  ON_HOLD: { label: 'On Hold', badgeClass: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300', dotClass: 'bg-zinc-400' },
  PENDING: { label: 'New Order', badgeClass: 'border-blue-500/30 bg-blue-500/10 text-blue-300', dotClass: 'bg-blue-400' },
};

export function resolveOrderStatusConfig(status) {
  return ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.PENDING;
}

export function formatOrderDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export const ADMIN_STATUS_OPTIONS = Object.entries(ORDER_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));
