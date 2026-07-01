import {
  Bell,
  CreditCard,
  Headphones,
  Lock,
  Package,
  Shirt,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export const NOTIFICATION_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'ORDERS', label: 'Orders' },
  { id: 'SUPPORT', label: 'Support' },
  { id: 'SHOPPING', label: 'Shopping' },
  { id: 'SECURITY', label: 'Security' },
  { id: 'SYSTEM', label: 'System' },
  { id: 'PROFILE', label: 'Profile' },
  { id: 'ADMIN', label: 'Admin' },
];

/** User dashboard notification groups (maps to existing API categories). */
export const USER_NOTIFICATION_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'ORDERS', label: 'Orders' },
  { id: 'SHOPPING', label: 'Wishlist' },
  { id: 'PROFILE', label: 'AI' },
  { id: 'SUPPORT', label: 'Support' },
  { id: 'SYSTEM', label: 'System' },
];

export function resolveNotificationIcon(notification) {
  const category = notification?.category;
  const type = String(notification?.type || '').toUpperCase();

  if (category === 'SUPPORT' || type.includes('TICKET') || type.includes('REPLIED')) {
    return Headphones;
  }

  if (category === 'ORDERS' || type.includes('ORDER') || type.includes('PACKED') || type.includes('SHIPPED')) {
    return Package;
  }

  if (type.includes('PAYMENT')) {
    return CreditCard;
  }

  if (type.includes('DELIVER') || type.includes('TRANSIT') || type.includes('HANDED')) {
    return Truck;
  }

  if (category === 'SHOPPING' || type.includes('WISHLIST') || type.includes('CART') || type.includes('COUPON')) {
    return ShoppingBag;
  }

  if (type.includes('TRY_ON') || type.includes('VIRTUAL')) {
    return Shirt;
  }

  if (category === 'PROFILE' || type.includes('FACE') || type.includes('BODY') || type.includes('AVATAR')) {
    return User;
  }

  if (category === 'SECURITY' || type.includes('LOGIN') || type.includes('SECURITY')) {
    return Lock;
  }

  if (category === 'ADMIN') {
    return Bell;
  }

  return Sparkles;
}

export function resolveNotificationHref(notification, isAdmin = false) {
  if (notification?.entityType === 'order' && notification?.entityId) {
    return isAdmin
      ? `${ROUTES.ADMIN.ORDERS}?order=${notification.entityId}`
      : ROUTES.ORDERS_BY_ID(notification.entityId);
  }

  if (notification?.entityType === 'ticket' && notification?.entityId) {
    return isAdmin
      ? `${ROUTES.ADMIN.SUPPORT}?ticket=${notification.entityId}`
      : ROUTES.SUPPORT.TICKET(notification.entityId);
  }

  const actionPath = notification?.actionPath;

  if (actionPath) {
    if (isAdmin && actionPath.startsWith('/admin')) {
      return actionPath;
    }

    if (!isAdmin && actionPath.startsWith('/admin')) {
      return ROUTES.DASHBOARD.HOME;
    }

    if (!isAdmin || !actionPath.startsWith('/support/tickets/')) {
      return actionPath;
    }
  }

  if (notification?.entityType === 'try_on_result') {
    return ROUTES.AI.VIRTUAL_TRY_ON;
  }

  const type = String(notification?.type || '').toUpperCase();

  if (type.includes('WISHLIST') || notification?.actionPath === ROUTES.WISHLIST) {
    return ROUTES.WISHLIST;
  }

  if (notification?.category === 'SHOPPING') {
    return ROUTES.WISHLIST;
  }

  if (
    type.includes('RECOMMEND')
    || type.includes('STYLIST')
    || type.includes('FASHION_DNA')
    || notification?.actionPath === ROUTES.AI.RECOMMENDATIONS
  ) {
    return ROUTES.AI.RECOMMENDATIONS;
  }

  if (
    type.includes('FACE')
    || type.includes('BODY')
    || type.includes('AVATAR')
    || notification?.category === 'PROFILE'
  ) {
    if (type.includes('BODY')) {
      return ROUTES.BODY.ANALYSIS;
    }
    if (type.includes('AVATAR')) {
      return ROUTES.AVATAR.HOME;
    }
    if (type.includes('FACE')) {
      return ROUTES.FACE.ANALYSIS;
    }
    return ROUTES.PROFILE.HOME;
  }

  return null;
}

export function formatRelativeTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString();
}

export function groupNotificationsByDate(items = []) {
  const groups = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  items.forEach((item) => {
    const created = new Date(item.createdAt);

    if (created >= startOfToday) {
      groups.today.push(item);
      return;
    }

    if (created >= startOfYesterday) {
      groups.yesterday.push(item);
      return;
    }

    groups.earlier.push(item);
  });

  return [
    { id: 'today', label: 'Today', items: groups.today },
    { id: 'yesterday', label: 'Yesterday', items: groups.yesterday },
    { id: 'earlier', label: 'Earlier', items: groups.earlier },
  ].filter((group) => group.items.length > 0);
}
