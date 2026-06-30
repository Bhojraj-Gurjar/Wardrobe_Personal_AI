'use client';

import {
  Package,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { FREE_SHIPPING_MIN_INR } from '@/constants/commerce';
import { formatCurrency } from '@/utils/currency';
import { PDP_GLASS_CLASS } from '../../styles/product-details-tokens';

const ITEMS = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: `On orders over ${formatCurrency(FREE_SHIPPING_MIN_INR)}`,
  },
  { icon: Package, title: 'Estimated Delivery', description: '2–5 business days' },
  { icon: RotateCcw, title: 'Easy Returns', description: '30-day hassle-free returns' },
  { icon: ShieldCheck, title: 'Secure Checkout', description: 'Encrypted payments' },
  { icon: Sparkles, title: 'Authentic Product', description: 'Verified Wardrobe AI catalog' },
];

export function DeliveryCard() {
  return (
    <div className={`${PDP_GLASS_CLASS} grid gap-3 p-5 sm:grid-cols-2`}>
      {ITEMS.map((item) => (
        <div key={item.title} className="flex gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#C4B5FD]">
            <item.icon className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{item.title}</p>
            <p className="mt-1 text-xs text-white/50">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
