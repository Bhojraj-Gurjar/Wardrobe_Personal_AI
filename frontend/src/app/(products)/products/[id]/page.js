import { ProductDetailView } from '@/features/products/components/product-detail-view';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Product ${id}` };
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-[#070B17] px-4 py-6 sm:px-6 lg:px-8">
      <ProductDetailView productId={id} />
    </div>
  );
}
