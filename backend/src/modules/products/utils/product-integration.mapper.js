import { formatAvatarWearable } from '../constants/avatar.constants';
import { resolveProductReference } from './product-identity.util';

/**
 * Cross-module product contract for Fashion DNA, Digital Avatar,
 * Recommendation Engine, and Virtual Try-On integrations.
 */
export function formatProductIntegrationProfile(product) {
  const category = product.category ?? product.category_id ?? null;
  const brand = product.brand ?? product.brand_id ?? null;
  const imageUrl = product.image_url
    ?? product.images?.find((image) => image.is_primary)?.url
    ?? product.images?.[0]?.url
    ?? null;

  const refs = resolveProductReference(product);
  const avatarWearable = formatAvatarWearable({
    ...product,
    imageUrl,
    avatarCategory: product.avatar_category,
    overlayOrder: product.overlay_order,
    avatarOverlayUrl: product.avatar_overlay_url,
  });

  return {
    refs,
    fashionDna: {
      productId: refs.productId,
      sku: refs.sku,
      brand,
      color: product.color ?? null,
      category,
      subcategory: product.subcategory ?? null,
      styleTags: product.style_tags ?? [],
      occasionTags: product.occasion_tags ?? [],
      price: product.price,
      fitType: product.fit_type ?? null,
      fabric: product.fabric ?? null,
      gender: product.gender ?? null,
    },
    digitalAvatar: avatarWearable,
    recommendation: {
      productId: refs.productId,
      sku: refs.sku,
      brand,
      category,
      subcategory: product.subcategory ?? null,
      styleTags: product.style_tags ?? [],
      occasionTags: product.occasion_tags ?? [],
      price: product.price,
      gender: product.gender ?? null,
    },
    virtualTryOn: {
      productId: refs.productId,
      sku: refs.sku,
      imageUrl,
      avatarOverlayUrl: product.avatar_overlay_url ?? null,
      avatarCategory: product.avatar_category ?? null,
      overlayOrder: product.overlay_order ?? null,
      fitType: product.fit_type ?? null,
      gender: product.gender ?? null,
      sizeOptions: product.size_options ?? [],
      color: product.color ?? null,
      fabric: product.fabric ?? null,
    },
  };
}
