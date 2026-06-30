'use client';



import { useMemo, useState } from 'react';

import dynamic from 'next/dynamic';

import Link from 'next/link';

import { useRouter } from 'next/navigation';

import { Package } from 'lucide-react';

import { ROUTES } from '@/constants/routes';

import { OrderHistoryCard } from '@/features/orders/components/order-history-card';

import { useCancelOrderMutation, useOrdersQuery } from '@/features/orders/hooks';

import { useOrderEvents } from '@/features/orders/hooks/use-order-events';

import { ORDER_STATUS_FILTERS } from '@/features/orders/utils/order-status';

import { EmptyState } from '@/components/shared/empty-state';

import { ErrorState } from '@/components/shared/error-state';

import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/utils/cn';

const OrderTrackingModal = dynamic(
  () => import('@/features/orders/components/order-tracking-modal').then((module) => module.OrderTrackingModal),
  { ssr: false },
);



function OrdersSkeleton() {

  return (

    <div className="space-y-8">

      <div className="space-y-2">

        <Skeleton className="h-9 w-48" />

        <Skeleton className="h-4 w-32" />

      </div>

      <div className="space-y-4">

        {Array.from({ length: 4 }).map((_, index) => (

          <Skeleton key={index} className="h-24 w-full rounded-2xl" />

        ))}

      </div>

    </div>

  );

}



export function OrdersView() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);
  const [trackingOrderId, setTrackingOrderId] = useState(null);

  useOrderEvents();



  const queryParams = useMemo(

    () => ({

      page: 1,

      limit: 50,

      status: statusFilter === 'ALL' ? undefined : statusFilter,

    }),

    [statusFilter],

  );



  const { data, isLoading, isError, error, refetch } = useOrdersQuery(queryParams);

  const cancelOrder = useCancelOrderMutation();



  if (isLoading) {

    return <OrdersSkeleton />;

  }



  if (isError) {

    return (

      <ErrorState

        title="Could not load orders"

        description={error?.message || 'Something went wrong.'}

        onRetry={refetch}

      />

    );

  }



  const orders = data?.items ?? [];
  const trackingOrder = orders.find((order) => order.id === trackingOrderId) ?? null;



  function handleCancel(orderId) {

    if (!window.confirm('Cancel this order?')) return;

    setCancellingId(orderId);

    cancelOrder.mutate(orderId, {

      onSettled: () => setCancellingId(null),

    });

  }



  return (

    <div className="mx-auto w-full max-w-4xl space-y-8 pb-8">

      <div>

        <h1 className="text-2xl font-bold tracking-tight text-dashboard-foreground sm:text-3xl">

          Order History

        </h1>

        <p className="mt-1 text-sm text-dashboard-muted">

          {orders.length} {orders.length === 1 ? 'order' : 'orders'}

        </p>

      </div>



      <div className="flex flex-wrap gap-2">

        {ORDER_STATUS_FILTERS.map((filter) => (

          <button

            key={filter.id}

            type="button"

            className={cn(

              'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200',

              statusFilter === filter.id

                ? 'border-primary bg-primary text-primary-foreground shadow-sm'

                : 'border-dashboard-border bg-dashboard-surface text-dashboard-muted hover:border-primary/40 hover:text-dashboard-foreground',

            )}

            onClick={() => setStatusFilter(filter.id)}

          >

            {filter.label}

          </button>

        ))}

      </div>



      {!orders.length ? (

        <EmptyState

          icon={Package}

          title="No orders yet"

          description="Your completed checkouts will appear here."

          actionLabel="Browse products"

          onAction={() => router.push(ROUTES.PRODUCTS.LIST)}

          className="border-dashboard-border bg-dashboard-surface/50"

        />

      ) : (

        <div className="space-y-4">

          {orders.map((order) => (

            <OrderHistoryCard
              key={order.id}
              order={order}
              onCancel={handleCancel}
              onTrack={(selectedOrder) => setTrackingOrderId(selectedOrder.id)}
              isCancelling={cancellingId === order.id && cancelOrder.isPending}
            />

          ))}

        </div>

      )}



      {orders.length ? (

        <div className="text-center">

          <Link

            href={ROUTES.PRODUCTS.LIST}

            className="text-sm font-medium text-dashboard-muted transition-colors hover:text-primary"

          >

            Continue Shopping

          </Link>

        </div>

      ) : null}

      <OrderTrackingModal
        orderId={trackingOrderId}
        initialOrder={trackingOrder}
        open={Boolean(trackingOrderId)}
        onClose={() => setTrackingOrderId(null)}
      />
    </div>
  );
}

