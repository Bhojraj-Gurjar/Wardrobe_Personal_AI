import {
  BarChart3,
  Headphones,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', href: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
  { label: 'Users', href: ROUTES.ADMIN.USERS, icon: Users },
  { label: 'Products', href: ROUTES.ADMIN.PRODUCTS, icon: Package },
  { label: 'Orders', href: ROUTES.ADMIN.ORDERS, icon: ShoppingBag },
  { label: 'Support Tickets', href: ROUTES.ADMIN.SUPPORT, icon: Headphones },
  { label: 'Analytics', href: ROUTES.ADMIN.ANALYTICS, icon: BarChart3 },
];
