'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { QUERY_STALE_TIME } from '@/constants/app';
import { ROUTES } from '@/constants/routes';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { useCartQuery } from '@/features/cart/hooks';
import { formatProductPrice } from '@/features/products/utils/product-catalog.utils';
import { CheckoutStepper } from '@/features/checkout/components/checkout-stepper';
import { AddressForm } from '@/features/checkout/components/address-form';
import { PaymentSelector } from '@/features/checkout/components/payment-selector';
import { OrderSuccess } from '@/features/checkout/components/order-success';
import { checkoutCart, createAddress, fetchAddresses } from '@/features/checkout/services/checkout.service';
import { getUserAccessToken, useUserAccessToken, useUserProfile, useAuthStore } from '@/stores/auth-store';
import { cn } from '@/utils/cn';

const EMPTY_ADDRESS = {
  full_name: '',
  phone: '',
  alternate_phone: '',
  country: 'India',
  state: '',
  city: '',
  pincode: '',
  house_no: '',
  landmark: '',
  address_type: 'HOME',
  is_default: true,
};

function validateAddress(address) {
  const errors = {};
  ['full_name', 'phone', 'state', 'city', 'pincode', 'house_no'].forEach((field) => {
    if (!String(address[field] || '').trim()) {
      errors[field] = 'Required';
    }
  });

  if (address.pincode && !/^\d{6}$/.test(address.pincode)) {
    errors.pincode = 'Enter a valid 6-digit pincode';
  }

  return errors;
}

export function CheckoutView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const coupon = searchParams.get('coupon');
  const token = useUserAccessToken();
  const queryClient = useQueryClient();

  const [step, setStep] = useState('address');
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [addressErrors, setAddressErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const cartQuery = useCartQuery(coupon);
  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: () => fetchAddresses(token),
    enabled: Boolean(token),
    staleTime: QUERY_STALE_TIME.DEFAULT,
  });

  const checkoutMutation = useMutation({
    mutationFn: (payload) => checkoutCart(token, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setPlacedOrder(data.order);
      setStep('success');
    },
  });

  const saveAddressMutation = useMutation({
    mutationFn: (payload) => createAddress(token, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const summary = cartQuery.data?.summary || {};
  const items = cartQuery.data?.items || [];
  const tax = useMemo(
    () => Math.round((summary.subtotal - (summary.discount || 0)) * 0.05 * 100) / 100,
    [summary.discount, summary.subtotal],
  );
  const grandTotal = (summary.total || 0) + tax;

  const buildCheckoutPayload = async () => {
    let addressId = selectedAddressId;

    if (useNewAddress || !addressesQuery.data?.length) {
      const errors = validateAddress(address);
      setAddressErrors(errors);

      if (Object.keys(errors).length) {
        throw new Error('Invalid address');
      }

      const saved = await saveAddressMutation.mutateAsync(address);
      addressId = saved.id;
    }

    return {
      coupon_code: coupon || summary.appliedCoupon || undefined,
      payment_method: paymentMethod,
      address_id: addressId,
    };
  };

  const handlePlaceOrder = async () => {
    if (!termsAccepted) {
      return;
    }

    try {
      const payload = await buildCheckoutPayload();
      await checkoutMutation.mutateAsync(payload);
    } catch {
      // validation errors handled inline
    }
  };

  if (placedOrder && step === 'success') {
    return <OrderSuccess order={placedOrder} />;
  }

  if (cartQuery.isLoading) {
    return <LoadingState title="Loading checkout…" />;
  }

  if (cartQuery.isError) {
    return <ErrorState title="Unable to load cart" onRetry={() => cartQuery.refetch()} />;
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-dashboard-border bg-dashboard-surface p-8 text-center">
        <p className="text-dashboard-muted">Your cart is empty.</p>
        <Button className="mt-4" onClick={() => router.push(ROUTES.CART)}>Back to Cart</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href={ROUTES.CART} className="inline-flex items-center gap-2 text-sm text-dashboard-muted hover:text-dashboard-foreground">
          <ArrowLeft className="size-4" /> Back to cart
        </Link>
      </div>

      <h1 className="mb-2 text-3xl font-bold text-dashboard-foreground">Checkout</h1>
      <p className="mb-6 text-sm text-dashboard-muted">Secure premium checkout — shipping, payment, and review.</p>

      <CheckoutStepper currentStep={step} />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-3xl border border-dashboard-border bg-dashboard-surface p-6">
          {step === 'address' ? (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-dashboard-foreground">Shipping Address</h2>

              {addressesQuery.data?.length ? (
                <div className="space-y-3">
                  {addressesQuery.data.map((saved) => (
                    <button
                      key={saved.id}
                      type="button"
                      onClick={() => {
                        setUseNewAddress(false);
                        setSelectedAddressId(saved.id);
                      }}
                      className={cn(
                        'w-full rounded-2xl border p-4 text-left transition-all',
                        selectedAddressId === saved.id && !useNewAddress
                          ? 'border-primary/50 bg-primary/10'
                          : 'border-dashboard-border hover:border-primary/30',
                      )}
                    >
                      <p className="font-semibold text-dashboard-foreground">{saved.full_name}</p>
                      <p className="mt-1 text-sm text-dashboard-muted">
                        {saved.house_no}, {saved.city}, {saved.state} {saved.pincode}
                      </p>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setUseNewAddress(true)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    + Add new address
                  </button>
                </div>
              ) : null}

              {(useNewAddress || !addressesQuery.data?.length) ? (
                <AddressForm value={address} onChange={setAddress} errors={addressErrors} />
              ) : null}

              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  if (useNewAddress || !addressesQuery.data?.length) {
                    const errors = validateAddress(address);
                    setAddressErrors(errors);

                    if (Object.keys(errors).length) {
                      return;
                    }
                  } else if (!selectedAddressId) {
                    return;
                  }

                  setStep('payment');
                }}
              >
                Continue to Payment <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : null}

          {step === 'payment' ? (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-dashboard-foreground">Payment Method</h2>
              <PaymentSelector value={paymentMethod} onChange={setPaymentMethod} />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="glass"
                  onClick={() => setStep('address')}
                  aria-label="Go back to shipping address"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </Button>
                <Button onClick={() => setStep('review')}>Review Order</Button>
              </div>
            </div>
          ) : null}

          {step === 'review' ? (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-dashboard-foreground">Review Order</h2>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-dashboard-border p-3">
                    <div>
                      <p className="font-medium text-dashboard-foreground">{item.product?.name}</p>
                      <p className="text-sm text-dashboard-muted">Qty {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-dashboard-foreground">{formatProductPrice(item.price * item.quantity)}</p>
                  </li>
                ))}
              </ul>
              <label className="flex items-start gap-3 text-sm text-dashboard-muted">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1"
                />
                I agree to the Terms & Conditions and return policy.
              </label>
              {checkoutMutation.isError ? (
                <p className="text-sm text-red-400">{checkoutMutation.error?.message || 'Checkout failed'}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="glass"
                  onClick={() => setStep('payment')}
                  aria-label="Go back to payment method"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </Button>
                <Button
                  disabled={!termsAccepted || checkoutMutation.isPending}
                  onClick={handlePlaceOrder}
                >
                  {checkoutMutation.isPending ? 'Placing Order…' : 'Place Order'}
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="h-fit rounded-3xl border border-dashboard-border bg-dashboard-surface p-5">
          <h3 className="text-lg font-bold text-dashboard-foreground">Order Summary</h3>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-dashboard-muted">Subtotal</dt><dd>{formatProductPrice(summary.subtotal)}</dd></div>
            {summary.discount > 0 ? (
              <div className="flex justify-between text-emerald-400"><dt>Discount</dt><dd>-{formatProductPrice(summary.discount)}</dd></div>
            ) : null}
            <div className="flex justify-between"><dt className="text-dashboard-muted">Shipping</dt><dd>{summary.shipping === 0 ? 'Free' : formatProductPrice(summary.shipping)}</dd></div>
            <div className="flex justify-between"><dt className="text-dashboard-muted">Tax (GST)</dt><dd>{formatProductPrice(tax)}</dd></div>
            <div className="flex justify-between border-t border-dashboard-border pt-3 text-base font-bold">
              <dt>Grand Total</dt><dd>{formatProductPrice(grandTotal)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-dashboard-muted">
            Estimated delivery: {summary.estimatedDelivery || '3–5 business days'}
          </p>
        </aside>
      </div>
    </div>
  );
}
