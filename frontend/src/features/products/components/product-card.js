import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { ProductCardImage } from '@/features/products/components/product-card-image';
import {
  formatProductPrice,
  getProductImageUrl,
  isProductComingSoon,
} from '@/features/products/utils/product-catalog.utils';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const BADGE_STYLES = {
  match: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  recommended: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
  trending: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
  budget: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  editor: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
};

export function ProductCard({ product, badges = [], recommendationReason = null }) {
  const imageUrl = getProductImageUrl(product);
  const comingSoon = isProductComingSoon(product);
  const productHref = product?.id
    ? ROUTES.PRODUCTS.DETAIL(product.id)
    : ROUTES.PRODUCTS.LIST;

  return (
    <Link href={productHref} className="block h-full cursor-pointer">
      <Card className="group interactive-card h-full overflow-hidden">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <ProductCardImage
            src={imageUrl}
            alt={product.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            imageClassName="transition-transform duration-300 group-hover:scale-105"
          />
          {!comingSoon && badges.length ? (
            <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
              {badges.map((badge) => (
                <Badge
                  key={`${product.id}-${badge.label}`}
                  variant="outline"
                  className={BADGE_STYLES[badge.variant] || BADGE_STYLES.recommended}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          ) : null}
          {comingSoon ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#070B1A]/50 backdrop-blur-[1px]">
              <span className="rounded-full border border-violet-300/40 bg-gradient-to-r from-violet-600/95 to-purple-500/95 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_0_28px_rgba(124,58,237,0.45)]">
                Coming Soon
              </span>
            </div>
          ) : null}
        </div>
        <CardHeader className="space-y-2 pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base">{product.name}</CardTitle>
            <Badge variant="secondary" className="shrink-0">
              {formatProductPrice(product.price)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {product.productType || product.product_type ? (
            <p className="text-xs font-medium uppercase tracking-wide text-violet-300/80">
              {product.productType || product.product_type}
            </p>
          ) : null}
          {recommendationReason ? (
            <p className="line-clamp-2 text-sm text-violet-300/90">{recommendationReason}</p>
          ) : null}
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {product.description || 'No description available.'}
          </p>
        </CardContent>
        <CardFooter className="pt-0">
          <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
