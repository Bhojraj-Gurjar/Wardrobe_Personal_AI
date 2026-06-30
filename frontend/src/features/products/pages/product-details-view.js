'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useProductQuery, useProductsQuery } from '@/features/products/hooks';
import { useRecommendationsQuery } from '@/features/ai/hooks/use-recommendations';
import { trackProductView } from '@/features/user-activity/hooks/use-user-activity';
import { ProductBreadcrumb } from '@/features/products/components/product-details/product-breadcrumb';
import { ProductGallery } from '@/features/products/components/product-details/product-gallery';
import { ProductInfo } from '@/features/products/components/product-details/product-info';
import { ProductPrice } from '@/features/products/components/product-details/product-price';
import { ProductVariants } from '@/features/products/components/product-details/product-variants';
import { QuantitySelector } from '@/features/products/components/product-details/quantity-selector';
import { PurchaseActions } from '@/features/products/components/product-details/purchase-actions';
import { DeliveryCard } from '@/features/products/components/product-details/delivery-card';
import { FeatureList } from '@/features/products/components/product-details/feature-list';
import { ReviewSection } from '@/features/products/components/product-details/review-section';
import {
  ProductRecommendations,
  RecentlyViewed,
  SimilarProducts,
} from '@/features/products/components/product-details/product-recommendations';
import { MobilePurchaseBar } from '@/features/products/components/product-details/sticky-purchase-card';
import { ProductSkeleton } from '@/features/products/components/product-details/product-skeleton';
import { ProductError } from '@/features/products/components/product-details/product-error';
import { PDP_MOTION } from '@/features/products/styles/product-details-tokens';
import {
  getGalleryImages,
  getProductColors,
  getProductSizes,
  recordRecentlyViewed,
  readRecentlyViewedIds,
} from '@/features/products/utils/product-details.utils';
import { resolveRecommendationItems, asArray } from '@/features/products/utils/product-catalog.utils';

export function ProductDetailsView({ productId }) {
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [recentIds, setRecentIds] = useState([]);

  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useProductQuery(productId);

  const { data: recommendationsData, isLoading: recommendationsLoading } = useRecommendationsQuery({
    productId,
    limit: 50,
  });

  const { data: catalogData } = useProductsQuery({ limit: 80 });

  const galleryImages = useMemo(
    () => getGalleryImages(product),
    [product],
  );

  const colors = useMemo(() => getProductColors(product), [product]);
  const sizes = useMemo(() => getProductSizes(product), [product]);

  const similarProducts = useMemo(() => {
    const items = asArray(catalogData?.items || catalogData?.data);
    if (!product?.category) {
      return items.filter((item) => item.id !== productId).slice(0, 8);
    }

    return items
      .filter((item) => item.id !== productId && item.category === product.category)
      .slice(0, 8);
  }, [catalogData, product?.category, productId]);

  const recentlyViewedProducts = useMemo(() => {
    const items = asArray(catalogData?.items || catalogData?.data);
    return recentIds
      .map((id) => items.find((item) => item.id === id))
      .filter(Boolean)
      .slice(0, 8);
  }, [catalogData, recentIds]);

  const recommendationItems = useMemo(
    () => resolveRecommendationItems(recommendationsData)
      .map((item) => item?.product || item)
      .filter((product) => product?.id && product.id !== productId)
      .slice(0, 8),
    [productId, recommendationsData],
  );

  useEffect(() => {
    if (!product?.id) {
      return;
    }

    trackProductView(product.id);
    recordRecentlyViewed(product.id);
    setRecentIds(readRecentlyViewedIds(product.id));
  }, [product?.id]);

  useEffect(() => {
    if (colors.length && !selectedColor) {
      setSelectedColor(colors[0].id);
    }
  }, [colors, selectedColor]);

  useEffect(() => {
    if (sizes.length && !selectedSize) {
      const firstAvailable = sizes.find((size) => size.inStock) || sizes[0];
      setSelectedSize(firstAvailable?.id || '');
    }
  }, [sizes, selectedSize]);

  if (isLoading) {
    return <ProductSkeleton />;
  }

  if (isError || !product) {
    return (
      <ProductError
        message={error?.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <motion.div {...PDP_MOTION.page} className="mx-auto max-w-7xl space-y-10 pb-28 lg:pb-10">
      <ProductBreadcrumb product={product} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
        <ProductGallery
          images={galleryImages}
          productName={product.name}
        />

        <div className="space-y-6 lg:sticky lg:top-24">
          <ProductInfo product={product} />
          <ProductPrice product={product} />

          <ProductVariants
            colors={colors}
            sizes={sizes}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            onColorChange={setSelectedColor}
            onSizeChange={setSelectedSize}
          />

          <QuantitySelector quantity={quantity} onChange={setQuantity} />
          <PurchaseActions product={product} quantity={quantity} />
          <DeliveryCard />
        </div>
      </div>

      <FeatureList product={product} />

      <div className="space-y-12">
        <ProductRecommendations
          products={recommendationItems}
          isLoading={recommendationsLoading}
        />
        <SimilarProducts products={similarProducts} />
        <RecentlyViewed products={recentlyViewedProducts} />
        <ReviewSection product={product} />
      </div>

      <MobilePurchaseBar product={product} quantity={quantity} />
    </motion.div>
  );
}
