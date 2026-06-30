import { ROUTES } from '@/constants/routes';
import {
  Camera,
  Dna,
  Headphones,
  Heart,
  Home,
  LayoutGrid,
  MessageSquare,
  Package,
  Ruler,
  ScanFace,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
  User,
  UserCircle,
} from 'lucide-react';

export const SIDEBAR_STYLES = {
  panel: 'border-r border-white/[0.06] bg-[#0b101b]',
  brandTitle: 'text-sm font-bold tracking-[0.12em] text-white',
  sectionLabel:
    'px-3 pb-1.5 pt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 first:pt-2',
  itemBase:
    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
  itemInactive: 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200',
  itemActive: 'bg-purple-500/12 text-purple-300 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.18)]',
  itemIcon: 'size-[18px] shrink-0',
  activeDot: 'ml-auto size-1.5 rounded-full bg-purple-400',
  logo:
    'flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-[0_0_20px_rgba(139,92,246,0.35)]',
};

export const SIDEBAR_NAV_SECTIONS = [
  {
    title: 'MAIN',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: ROUTES.DASHBOARD.HOME,
        icon: Home,
      },
      {
        id: 'recommendations',
        label: 'Recommendations',
        href: ROUTES.AI.RECOMMENDATIONS,
        icon: Sparkles,
      },
    ],
  },
  {
    title: 'FASHION AI',
    items: [
      {
        id: 'fashion-dna',
        label: 'Fashion DNA',
        href: ROUTES.AI.FASHION_DNA,
        icon: Dna,
      },
      {
        id: 'face-analysis',
        label: 'Face Analysis',
        href: ROUTES.FACE.ANALYSIS,
        icon: ScanFace,
      },
      {
        id: 'body-analysis',
        label: 'Body Analysis',
        href: ROUTES.BODY.ANALYSIS,
        icon: Ruler,
      },
      {
        id: 'digital-avatar',
        label: 'Digital Avatar',
        href: ROUTES.AVATAR.HOME,
        icon: User,
      },
    ],
  },
  {
    title: 'SHOPPING',
    items: [
      {
        id: 'products',
        label: 'Products',
        href: ROUTES.PRODUCTS.LIST,
        icon: LayoutGrid,
      },
      {
        id: 'wishlist',
        label: 'Wishlist',
        href: ROUTES.WISHLIST,
        icon: Heart,
      },
      {
        id: 'cart',
        label: 'Cart',
        href: ROUTES.CART,
        icon: ShoppingBag,
      },
    ],
  },
  {
    title: 'AI FEATURES',
    items: [
      {
        id: 'virtual-try-on',
        label: 'Virtual Try-On',
        href: ROUTES.AI.VIRTUAL_TRY_ON,
        icon: Camera,
      },
      {
        id: 'ai-stylist',
        label: 'AI Stylist',
        href: ROUTES.AI.STYLIST,
        icon: MessageSquare,
      },
    ],
  },
  {
    title: 'CUSTOMER SUPPORT',
    items: [
      {
        id: 'support-center',
        label: 'Support Center',
        href: ROUTES.SUPPORT.HOME,
        icon: Headphones,
      },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      {
        id: 'profile',
        label: 'Profile',
        href: ROUTES.PROFILE.HOME,
        icon: UserCircle,
        match: 'exact',
      },
      {
        id: 'personal-closet',
        label: 'Personal Closet',
        href: ROUTES.MY_CLOSET,
        icon: Shirt,
      },
      {
        id: 'orders',
        label: 'Orders',
        href: ROUTES.ORDERS,
        icon: Package,
      },
      {
        id: 'settings',
        label: 'Settings',
        href: ROUTES.PROFILE.SETTINGS,
        icon: Settings,
      },
    ],
  },
];
