export const SUPPORT_CATEGORIES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'TECHNICAL_ISSUE', label: 'Technical Issue' },
  { value: 'FACE_LOGIN', label: 'Face Login' },
  { value: 'VIRTUAL_TRY_ON', label: 'Virtual Try-On' },
  { value: 'AVATAR', label: 'Avatar' },
  { value: 'FASHION_DNA', label: 'Fashion DNA' },
  { value: 'ORDERS', label: 'Orders' },
  { value: 'PAYMENTS', label: 'Payments' },
  { value: 'CART', label: 'Cart' },
  { value: 'PRODUCTS', label: 'Products' },
  { value: 'RECOMMENDATION', label: 'Recommendation' },
  { value: 'ACCOUNT', label: 'Account' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'BUG_REPORT', label: 'Bug Report' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request' },
  { value: 'OTHER', label: 'Other' },
];

export const SUPPORT_PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export const SUPPORT_STATUSES = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'WAITING_FOR_CUSTOMER', label: 'Waiting For Customer' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'REOPENED', label: 'Reopened' },
  { value: 'ESCALATED', label: 'Escalated' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const CONTACT_METHODS = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'IN_APP', label: 'In App' },
];

export const STATUS_BADGE_STYLES = {
  OPEN: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  IN_PROGRESS: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  WAITING_FOR_CUSTOMER: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  RESOLVED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  CLOSED: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  REOPENED: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  ESCALATED: 'bg-red-500/15 text-red-300 border-red-500/30',
  CANCELLED: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

export const PRIORITY_BADGE_STYLES = {
  LOW: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  MEDIUM: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  HIGH: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  CRITICAL: 'bg-red-500/15 text-red-300 border-red-500/30',
};

export const QUICK_HELP_CARDS = [
  {
    title: 'Virtual Try-On Issues',
    description: 'Troubleshoot try-on generation, uploads, and saved outfits.',
    category: 'VIRTUAL_TRY_ON',
  },
  {
    title: 'Orders & Payments',
    description: 'Track orders, refunds, and checkout problems.',
    category: 'ORDERS',
  },
  {
    title: 'Face Login',
    description: 'Help with face registration and authentication.',
    category: 'FACE_LOGIN',
  },
  {
    title: 'Account & Profile',
    description: 'Update profile, password, and account settings.',
    category: 'ACCOUNT',
  },
];

export const ALLOWED_FILE_TYPES = 'image/png,image/jpeg,image/jpg,image/webp,application/pdf,text/plain';
export const MAX_FILE_SIZE_MB = 10;
