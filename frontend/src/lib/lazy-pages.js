import { createLazyView } from '@/lib/lazy-view';

export const DigitalAvatarView = createLazyView(
  () => import('@/features/digital-avatar/components/digital-avatar-view').then((mod) => mod.DigitalAvatarView),
  { ssr: false },
);

export const VirtualTryOnView = createLazyView(
  () => import('@/features/virtual-try-on/components/virtual-try-on-view').then((mod) => mod.VirtualTryOnView),
  { ssr: false },
);

export const FashionDnaView = createLazyView(
  () => import('@/features/fashion-dna/components').then((mod) => mod.FashionDnaView),
);

export const RecommendationsView = createLazyView(
  () => import('@/features/ai/components/recommendations-view').then((mod) => mod.RecommendationsView),
);

export const FaceAnalysisView = createLazyView(
  () => import('@/features/face-analysis/components/face-analysis-view').then((mod) => mod.FaceAnalysisView),
);

export const BodyAnalysisView = createLazyView(
  () => import('@/features/body-analysis/components/body-analysis-view').then((mod) => mod.BodyAnalysisView),
);

export const DashboardView = createLazyView(
  () => import('@/features/dashboard/components/dashboard-view').then((mod) => mod.DashboardView),
);

export const ProductsView = createLazyView(
  () => import('@/features/products/components/products-view').then((mod) => mod.ProductsView),
);

export const WishlistView = createLazyView(
  () => import('@/features/wishlist/components/wishlist-view').then((mod) => mod.WishlistView),
);

export const CartView = createLazyView(
  () => import('@/features/cart/components/cart-view').then((mod) => mod.CartView),
);

export const OrdersView = createLazyView(
  () => import('@/features/orders/components/orders-view').then((mod) => mod.OrdersView),
);

export const ClosetView = createLazyView(
  () => import('@/features/personal-closet/components/closet-view').then((mod) => mod.ClosetView),
);

export const AdminDashboardView = createLazyView(
  () => import('@/features/admin/components/admin-dashboard-view').then((mod) => mod.AdminDashboardView),
);
