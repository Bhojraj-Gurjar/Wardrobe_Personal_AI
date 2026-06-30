import { OrderDetailView } from '@/features/orders/components/order-detail-view';

export const metadata = {
  title: 'Order Details',
};

export default async function OrderDetailPage({ params }) {
  const { id } = await params;
  return <OrderDetailView orderId={id} />;
}
