import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StorageService } from '../../../storage/services/storage.service';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { resolveAdminProductTypeDisplay } from '../utils/admin-product-type.util';
import { formatCatalogProduct } from '../../products/utils/product-catalog.mapper';
import {
  isValidProductType,
  isTryOnCompatibleProductType,
  resolveAvatarCategoryFromProductType,
  resolveUiCategoryForProductType,
} from '../../products/constants/product-type.constants';
import { resolveRawProductImageUrl } from '../../products/utils/resolve-product-image.util';
import {
  isValidCmsCategory,
  isValidCmsProductType,
  normalizeCmsCategory,
} from '../constants/cms-taxonomy.constants';
import { AdminProductCmsRepository } from '../repositories/admin-product-cms.repository';
import { ProductService } from '../../products/services/product.service';
import { recordSeedSuppression } from '../../products/utils/product-seed-guard.util';

const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function computeDiscountPercent(mrp, sellingPrice) {
  if (!mrp || mrp <= 0) {
    return null;
  }

  const discount = ((mrp - sellingPrice) / mrp) * 100;
  return Math.max(0, Math.round(discount * 100) / 100);
}

function slugifySkuPart(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 12);
}

function resolveProductActiveState(visibility, isActiveOverride) {
  const normalized = String(visibility || 'DRAFT').toUpperCase();

  if (isActiveOverride === false || normalized === 'HIDDEN') {
    return false;
  }

  if (normalized === 'DRAFT') {
    return false;
  }

  return true;
}

export @Injectable()
class AdminProductCmsService {
  constructor(
    @Inject(AdminProductCmsRepository) cmsRepository,
    @Inject(StorageService) storageService,
    @Inject(StoragePathResolver) storagePathResolver,
    @Inject(ProductService) productService,
  ) {
    this.cmsRepository = cmsRepository;
    this.storageService = storageService;
    this.storagePathResolver = storagePathResolver;
    this.productService = productService;
  }

  async syncCatalogCache(productId = null) {
    await this.productService.invalidateCatalogCache(productId);
  }

  async deleteProduct(id) {
    const product = await this.cmsRepository.findProductById(id);

    if (!product) {
      return null;
    }

    const deleted = await this.cmsRepository.deleteProductById(id);

    if (deleted) {
      if (product.sku) {
        recordSeedSuppression(product.sku);
      }

      await this.cleanupProductStorage(product);
    }

    return deleted;
  }

  async archiveProduct(id) {
    const product = await this.cmsRepository.findProductById(id);

    if (!product) {
      return null;
    }

    const archived = await this.cmsRepository.archiveProductById(id);

    if (archived?.sku) {
      recordSeedSuppression(archived.sku);
    }

    return archived;
  }

  async cleanupProductStorage(product) {
    const urls = new Set();

    if (product.image_url) {
      urls.add(product.image_url);
    }

    if (product.try_on_image) {
      urls.add(product.try_on_image);
    }

    for (const image of product.images || []) {
      if (image?.url) {
        urls.add(image.url);
      }
    }

    for (const variant of product.variants || []) {
      if (variant?.image_url) {
        urls.add(variant.image_url);
      }
    }

    await Promise.all(
      [...urls].map((url) => this.storageService.deleteStoredFile(url).catch(() => false)),
    );
  }

  async listProducts(query) {
    const { products, total, page, limit } = await this.cmsRepository.findProducts(query);

    return {
      items: products.map((product) => this.formatListItem(product)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getProductDetail(id) {
    const product = await this.resolveProductForDetail(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const productId = String(product.id);
    const [analytics, inventoryHistory] = await Promise.all([
      this.cmsRepository.fetchProductAnalytics(productId).catch(() => ({
        views: 0,
        wishlistCount: 0,
        orders: 0,
      })),
      this.cmsRepository.getInventoryHistoryWithAdmin(productId, 15).catch(() => []),
    ]);

    return this.formatDetail(product, analytics, inventoryHistory);
  }

  async resolveProductForDetail(id) {
    const normalizedId = String(id ?? '').trim();

    if (!normalizedId) {
      return null;
    }

    let product = await this.cmsRepository.findProductById(normalizedId);

    if (!product) {
      const skuMatch = await this.cmsRepository.findProductBySku(normalizedId);

      if (skuMatch?.id) {
        product = await this.cmsRepository.findProductById(skuMatch.id);
      }
    }

    return product;
  }

  async createProduct(payload, adminUserId) {
    this.validateCreatePayload(payload);

    const sellingPrice = toNumber(payload.sellingPrice ?? payload.price);
    const mrp = payload.mrp != null ? toNumber(payload.mrp) : sellingPrice;
    const category = normalizeCmsCategory(payload.category);
    const productType = payload.productType;

    if (!isValidCmsProductType(productType, category) && !isValidProductType(productType)) {
      throw new BadRequestException('Invalid product type for the selected category.');
    }

    const sku = payload.sku?.trim() || this.generateProductSku(payload.name, productType);
    const existingSku = await this.cmsRepository.findProductBySku(sku);

    if (existingSku) {
      throw new BadRequestException(`SKU "${sku}" already exists.`);
    }

    if (payload.barcode) {
      const existingBarcode = await this.cmsRepository.findByBarcode(payload.barcode);
      if (existingBarcode) {
        throw new BadRequestException(`Barcode "${payload.barcode}" already exists.`);
      }
    }

    const variants = this.normalizeVariants(payload.variants, sku, sellingPrice);
    const stockQuantity = variants.length
      ? variants.reduce((sum, variant) => sum + variant.stock, 0)
      : toNumber(payload.stockQuantity ?? payload.stock, 0);

    const productData = {
      sku,
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      brand: payload.brand?.trim() || null,
      category,
      product_type: productType,
      gender: payload.gender || null,
      price: sellingPrice,
      mrp,
      discount_percent: payload.discountPercent != null
        ? toNumber(payload.discountPercent)
        : computeDiscountPercent(mrp, sellingPrice),
      tax_percent: payload.taxPercent != null ? toNumber(payload.taxPercent) : null,
      stock_quantity: stockQuantity,
      barcode: payload.barcode?.trim() || null,
      visibility: (payload.visibility || 'DRAFT').toUpperCase(),
      currency: payload.currency || 'INR',
      fabric: payload.fabric || null,
      fit_type: payload.fit || payload.fitType || null,
      pattern: payload.pattern || null,
      sleeve_type: payload.sleeveType || null,
      neck_type: payload.neckType || null,
      season: payload.season || null,
      care_instructions: payload.careInstructions || null,
      country_of_origin: payload.countryOfOrigin || null,
      material: payload.material || null,
      weight_grams: payload.weight != null ? toNumber(payload.weight) : null,
      dimensions: payload.dimensions || null,
      tags: payload.tags || null,
      search_keywords: payload.searchKeywords || null,
      cms_metadata: this.buildCmsMetadata(payload),
      style_tags: payload.aiAttributes?.style ? [payload.aiAttributes.style] : payload.styleTags || null,
      occasion_tags: payload.occasion ? [payload.occasion] : payload.occasionTags || null,
      is_featured: Boolean(payload.isFeatured),
      is_trending: Boolean(payload.isTrending),
      is_new_arrival: Boolean(payload.isNewArrival),
      is_best_seller: Boolean(payload.isBestSeller),
      is_limited_edition: Boolean(payload.isLimitedEdition),
      is_active: resolveProductActiveState(payload.visibility || 'DRAFT', payload.isActive),
      avatar_category: resolveAvatarCategoryFromProductType(productType),
      image_url: payload.images?.[0]?.url || payload.imageUrl || null,
    };

    const images = (payload.images || []).map((image, index) => ({
      url: image.url,
      sortOrder: image.sortOrder ?? index,
      isPrimary: image.isPrimary ?? index === 0,
    }));

    this.applyTryOnImageFields(productData, images, productType);

    const product = await this.cmsRepository.createProductWithRelations({
      productData,
      images,
      variants,
    });

    await this.syncCatalogCache(product.id);

    return this.formatDetail(product);
  }

  async updateProduct(id, payload, adminUserId) {
    const existing = await this.cmsRepository.findProductById(id);

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const category = payload.category != null
      ? normalizeCmsCategory(payload.category)
      : existing.category;
    const productType = payload.productType ?? existing.product_type;

    if (
      payload.productType
      && !isValidCmsProductType(productType, category)
      && !isValidProductType(productType)
    ) {
      throw new BadRequestException('Invalid product type for the selected category.');
    }

    const sellingPrice = payload.sellingPrice != null
      ? toNumber(payload.sellingPrice)
      : payload.price != null
        ? toNumber(payload.price)
        : existing.price;
    const mrp = payload.mrp != null ? toNumber(payload.mrp) : existing.mrp ?? sellingPrice;

    const variants = payload.variants !== undefined
      ? this.normalizeVariants(payload.variants, existing.sku, sellingPrice)
      : undefined;

    const stockQuantity = variants !== undefined
      ? variants.reduce((sum, variant) => sum + variant.stock, 0)
      : payload.stockQuantity != null
        ? toNumber(payload.stockQuantity)
        : undefined;

    const productData = {
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.description !== undefined ? { description: payload.description?.trim() || null } : {}),
      ...(payload.brand !== undefined ? { brand: payload.brand?.trim() || null } : {}),
      ...(payload.category !== undefined ? { category } : {}),
      ...(payload.productType !== undefined ? {
        product_type: productType,
        avatar_category: resolveAvatarCategoryFromProductType(productType),
      } : {}),
      ...(payload.gender !== undefined ? { gender: payload.gender } : {}),
      ...(payload.sellingPrice !== undefined || payload.price !== undefined ? { price: sellingPrice } : {}),
      ...(payload.mrp !== undefined ? { mrp } : {}),
      ...(payload.discountPercent !== undefined ? { discount_percent: toNumber(payload.discountPercent) } : {}),
      ...(payload.taxPercent !== undefined ? { tax_percent: toNumber(payload.taxPercent) } : {}),
      ...(stockQuantity !== undefined ? { stock_quantity: stockQuantity } : {}),
      ...(payload.barcode !== undefined ? { barcode: payload.barcode?.trim() || null } : {}),
      ...(payload.visibility !== undefined ? { visibility: payload.visibility.toUpperCase() } : {}),
      ...(payload.fabric !== undefined ? { fabric: payload.fabric } : {}),
      ...(payload.fit !== undefined || payload.fitType !== undefined
        ? { fit_type: payload.fit || payload.fitType }
        : {}),
      ...(payload.pattern !== undefined ? { pattern: payload.pattern } : {}),
      ...(payload.sleeveType !== undefined ? { sleeve_type: payload.sleeveType } : {}),
      ...(payload.neckType !== undefined ? { neck_type: payload.neckType } : {}),
      ...(payload.season !== undefined ? { season: payload.season } : {}),
      ...(payload.careInstructions !== undefined ? { care_instructions: payload.careInstructions } : {}),
      ...(payload.countryOfOrigin !== undefined ? { country_of_origin: payload.countryOfOrigin } : {}),
      ...(payload.material !== undefined ? { material: payload.material } : {}),
      ...(payload.weight !== undefined ? { weight_grams: toNumber(payload.weight) } : {}),
      ...(payload.dimensions !== undefined ? { dimensions: payload.dimensions } : {}),
      ...(payload.tags !== undefined ? { tags: payload.tags } : {}),
      ...(payload.searchKeywords !== undefined ? { search_keywords: payload.searchKeywords } : {}),
      ...(payload.aiAttributes !== undefined || payload.isFeatured !== undefined || payload.draftWizardStep != null
        ? {
          cms_metadata: this.buildCmsMetadata({
            ...existing,
            ...payload,
            cms_metadata: existing.cms_metadata,
            aiAttributes: payload.aiAttributes ?? existing.cms_metadata?.aiAttributes,
          }),
        }
        : {}),
      ...(payload.isFeatured !== undefined ? { is_featured: Boolean(payload.isFeatured) } : {}),
      ...(payload.isTrending !== undefined ? { is_trending: Boolean(payload.isTrending) } : {}),
      ...(payload.isNewArrival !== undefined ? { is_new_arrival: Boolean(payload.isNewArrival) } : {}),
      ...(payload.isBestSeller !== undefined ? { is_best_seller: Boolean(payload.isBestSeller) } : {}),
      ...(payload.isLimitedEdition !== undefined ? { is_limited_edition: Boolean(payload.isLimitedEdition) } : {}),
      ...(payload.isActive !== undefined ? { is_active: Boolean(payload.isActive) } : {}),
      ...(payload.visibility !== undefined
        ? { is_active: resolveProductActiveState(payload.visibility, payload.isActive) }
        : {}),
    };

    const images = payload.images !== undefined
      ? payload.images.map((image, index) => ({
        url: image.url,
        sortOrder: image.sortOrder ?? index,
        isPrimary: image.isPrimary ?? index === 0,
      }))
      : undefined;

    if (images?.length) {
      productData.image_url = images.find((image) => image.isPrimary)?.url || images[0].url;
    }

    this.applyTryOnImageFields(
      productData,
      images ?? existing.images?.map((image, index) => ({
        url: image.url,
        sortOrder: image.sort_order ?? index,
        isPrimary: image.is_primary ?? index === 0,
      })),
      productType,
      existing,
    );

    const product = await this.cmsRepository.updateProductWithRelations(id, {
      productData,
      images,
      variants,
    });

    await this.syncCatalogCache(id);

    return this.formatDetail(product);
  }

  async uploadProductImages(productId, files) {
    const product = await this.cmsRepository.findProductById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!files?.length) {
      throw new BadRequestException('At least one image file is required.');
    }

    const uploaded = [];

    for (const file of files) {
      if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
        throw new BadRequestException(`Unsupported image type: ${file.mimetype}`);
      }

      const fileId = randomUUID();
      const result = await this.storageService.uploadProductImage({
        productId,
        fileId,
        buffer: file.buffer,
        mimeType: file.mimetype,
      });

      uploaded.push({
        url: this.storagePathResolver.toPublicUrl(result.storagePath),
        storagePath: result.storagePath,
        fileId,
      });
    }

    await this.syncCatalogCache(productId);

    return { images: uploaded };
  }

  async adjustInventory(productId, payload, adminUserId) {
    const change = toNumber(payload.quantity);
    if (!change) {
      throw new BadRequestException('Quantity change must be non-zero.');
    }

    const changeType = change > 0 ? 'increase' : 'decrease';
    const result = await this.cmsRepository.adjustInventory({
      productId,
      variantId: payload.variantId || null,
      changeType,
      quantityChange: change,
      reason: payload.reason || null,
      adminUserId,
    });

    if (!result) {
      throw new NotFoundException('Product or variant not found');
    }

    await this.syncCatalogCache(productId);

    return this.formatDetail(result.product);
  }

  async getInventoryHistory(productId) {
    const product = await this.cmsRepository.findProductById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const history = await this.cmsRepository.getInventoryHistory(productId);

    return {
      items: history.map((entry) => ({
        id: entry.id,
        variantId: entry.variant_id,
        changeType: entry.change_type,
        quantityChange: entry.quantity_change,
        quantityBefore: entry.quantity_before,
        quantityAfter: entry.quantity_after,
        reason: entry.reason,
        createdAt: entry.created_at,
      })),
    };
  }

  validateCreatePayload(payload) {
    if (!payload.name?.trim()) {
      throw new BadRequestException('Product name is required.');
    }

    if (!payload.productType) {
      throw new BadRequestException('Product type is required.');
    }

    if (payload.category && !isValidCmsCategory(payload.category)) {
      throw new BadRequestException('Invalid category.');
    }

    const price = payload.sellingPrice ?? payload.price;
    if (price == null || toNumber(price) < 0) {
      throw new BadRequestException('Selling price must be zero or greater.');
    }
  }

  normalizeVariants(variants, baseSku, defaultPrice) {
    if (!Array.isArray(variants) || !variants.length) {
      return [];
    }

    return variants.map((variant, index) => {
      const color = String(variant.color || '').trim();
      const size = String(variant.size || '').trim();

      if (!color || !size) {
        throw new BadRequestException('Each variant requires color and size.');
      }

      const sku = variant.sku?.trim()
        || `${baseSku}-${slugifySkuPart(color)}-${slugifySkuPart(size)}`;

      return {
        color,
        size,
        sku,
        stock: Math.max(0, toNumber(variant.stock, 0)),
        priceOverride: variant.priceOverride != null ? toNumber(variant.priceOverride) : null,
        imageUrl: variant.imageUrl || null,
        barcode: variant.barcode || null,
        sortOrder: variant.sortOrder ?? index,
      };
    });
  }

  generateProductSku(name, productType) {
    const prefix = slugifySkuPart(productType).slice(0, 4) || 'PRD';
    const namePart = slugifySkuPart(name).slice(0, 6) || 'ITEM';
    const suffix = randomUUID().slice(0, 6).toUpperCase();
    return `${prefix}-${namePart}-${suffix}`;
  }

  applyTryOnImageFields(productData, images, productType, existing = null) {
    const primaryUrl = images?.find((image) => image.isPrimary)?.url
      || images?.[0]?.url
      || productData.image_url
      || existing?.image_url
      || resolveRawProductImageUrl(existing);

    if (primaryUrl) {
      productData.try_on_image = primaryUrl;
      if (!productData.image_url) {
        productData.image_url = primaryUrl;
      }
    }

    productData.is_try_on_compatible = isTryOnCompatibleProductType(productType);
  }

  buildCmsMetadata(payload) {
    const ai = payload.aiAttributes || payload.cms_metadata?.aiAttributes || {};
    const existingMeta = payload.cms_metadata && typeof payload.cms_metadata === 'object'
      ? payload.cms_metadata
      : {};

    return {
      adminDeleted: existingMeta.adminDeleted ?? false,
      draftWizardStep: payload.draftWizardStep != null
        ? Math.max(0, Math.min(Number(payload.draftWizardStep) || 0, 5))
        : (existingMeta.draftWizardStep ?? null),
      aiAttributes: {
        style: ai.style || null,
        bodyFit: ai.bodyFit || null,
        recommendedBodyTypes: ai.recommendedBodyTypes || [],
        recommendedFaceShapes: ai.recommendedFaceShapes || [],
      },
      visibilityFlags: {
        isFeatured: Boolean(payload.isFeatured),
        isTrending: Boolean(payload.isTrending),
        isNewArrival: Boolean(payload.isNewArrival),
        isBestSeller: Boolean(payload.isBestSeller),
        isLimitedEdition: Boolean(payload.isLimitedEdition),
      },
    };
  }

  formatListItem(product) {
    const formatted = formatCatalogProduct(product);
    const primaryImage = product.images?.find((image) => image.is_primary)
      || product.images?.[0];

    const variantCount = product.variants?.length || 0;
    const colors = [...new Set((product.variants || []).map((variant) => variant.color))];

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      category: product.category,
      productType: resolveAdminProductTypeDisplay(product),
      gender: product.gender,
      price: product.price,
      mrp: product.mrp,
      currency: product.currency,
      stock: product.stock_quantity ?? 0,
      variantCount,
      colors,
      sold: product.orders?.length || 0,
      rating: product.rating_avg ?? formatted.rating,
      reviewCount: product.review_count ?? 0,
      visibility: product.visibility,
      isActive: product.is_active,
      status: this.resolveStatusLabel(product),
      imageUrl: this.storagePathResolver.toPublicUrl(
        primaryImage?.url || product.image_url || formatted.image_url,
      ),
      isFeatured: product.is_featured,
      isTrending: product.is_trending,
      isNewArrival: product.is_new_arrival,
      isBestSeller: product.is_best_seller,
      isLimitedEdition: product.is_limited_edition,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      draftWizardStep: product.cms_metadata?.draftWizardStep ?? null,
    };
  }

  formatDetail(product, analytics = null, inventoryHistory = null) {
    const list = this.formatListItem(product);
    const formatted = formatCatalogProduct(product);

    return {
      ...list,
      description: product.description,
      barcode: product.barcode,
      discountPercent: product.discount_percent,
      taxPercent: product.tax_percent,
      fabric: product.fabric,
      fit: product.fit_type,
      pattern: product.pattern,
      sleeveType: product.sleeve_type,
      neckType: product.neck_type,
      season: product.season,
      careInstructions: product.care_instructions,
      countryOfOrigin: product.country_of_origin,
      material: product.material,
      weight: product.weight_grams,
      dimensions: product.dimensions,
      tags: product.tags,
      searchKeywords: product.search_keywords,
      aiAttributes: product.cms_metadata?.aiAttributes || {},
      images: (product.images || []).map((image, index) => ({
        id: image.id,
        url: this.storagePathResolver.toPublicUrl(image.url),
        sortOrder: image.sort_order ?? index,
        isPrimary: image.is_primary,
      })),
      variants: (product.variants || []).map((variant) => ({
        id: variant.id,
        color: variant.color,
        size: variant.size,
        sku: variant.sku,
        stock: variant.stock,
        priceOverride: variant.price_override,
        imageUrl: variant.image_url
          ? this.storagePathResolver.toPublicUrl(variant.image_url)
          : null,
        barcode: variant.barcode,
        isActive: variant.is_active,
      })),
      gallery: formatted.images?.map((image) => ({
        ...image,
        url: this.storagePathResolver.toPublicUrl(image.url),
      })) || list.images,
      analytics: {
        views: Number(analytics?.views ?? product.view_count ?? 0) || 0,
        wishlistCount: Number(analytics?.wishlistCount ?? product.wishlist_count ?? 0) || 0,
        orders: Number(analytics?.orders ?? 0) || 0,
      },
      inventoryHistory: (Array.isArray(inventoryHistory)
        ? inventoryHistory
        : Array.isArray(product.inventory_history)
          ? product.inventory_history
          : []
      ).map((entry) => ({
        id: entry.id,
        variantId: entry.variant_id,
        changeType: entry.change_type,
        quantityChange: entry.quantity_change,
        quantityBefore: entry.quantity_before,
        quantityAfter: entry.quantity_after,
        reason: entry.reason,
        adminName: entry.adminName || null,
        createdAt: entry.created_at,
      })),
      lowStock: (product.stock_quantity ?? 0) <= 10,
      outOfStock: (product.stock_quantity ?? 0) <= 0,
    };
  }

  resolveStatusLabel(product) {
    if (!product.is_active || product.visibility === 'HIDDEN') {
      return 'Hidden';
    }

    if (product.visibility === 'DRAFT') {
      return 'Draft';
    }

    if ((product.stock_quantity ?? 0) <= 0 || product.visibility === 'OUT_OF_STOCK') {
      return 'Out of Stock';
    }

    return 'Published';
  }

  /** Backward-compatible simple product formatter for legacy admin responses. */
  formatLegacyProduct(product) {
    return this.formatListItem(product);
  }
}
