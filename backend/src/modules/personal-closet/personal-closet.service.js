import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartService } from '../cart/services/cart.service';
import { formatCatalogProduct } from '../products/utils/product-catalog.mapper';
import { PersonalClosetRepository } from './personal-closet.repository';
import {
  normalizeColorName,
  resolveColorHex,
  toDisplayColorName,
} from './utils/closet-color.util';

function parsePage(value, fallback = 1) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseLimit(value, fallback = 12, max = 50) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
}

function extractOutfitProducts(outfit) {
  const items = Array.isArray(outfit.items) && outfit.items.length
    ? outfit.items
    : outfit.products;

  return Array.isArray(items) ? items : [];
}

function resolveProductSize(product, metadataItem) {
  if (metadataItem?.size) {
    return metadataItem.size;
  }

  const options = product?.size_options;

  if (Array.isArray(options) && options.length) {
    return options[0];
  }

  if (options && typeof options === 'object') {
    const values = Object.values(options).flat();
    if (values.length) {
      return String(values[0]);
    }
  }

  return 'One Size';
}

function sumOutfitPrice(products) {
  return products.reduce((sum, item) => {
    const price = Number(item?.price ?? item?.product?.price ?? 0);
    return sum + (Number.isFinite(price) ? price : 0);
  }, 0);
}

export @Injectable()
class PersonalClosetService {
  constructor(
    @Inject(PersonalClosetRepository) repository,
    @Inject(CartService) cartService,
  ) {
    this.repository = repository;
    this.cartService = cartService;
  }

  async getOverview(userId) {
    const [purchasedItems, outfits, brands, colors] = await Promise.all([
      this.buildPurchasedItems(userId),
      this.getSavedOutfits(userId),
      this.computeFavoriteBrands(userId),
      this.computeFavoriteColors(userId),
    ]);

    return {
      purchasedItems: purchasedItems.length,
      savedOutfits: outfits.length,
      favoriteBrands: brands.length,
      favoriteColors: colors.length,
    };
  }

  async getPurchasedItems(userId, query = {}) {
    const items = await this.buildPurchasedItems(userId);
    return this.filterAndPaginatePurchased(items, query);
  }

  async removePurchasedItem(userId, orderId, productId) {
    const items = await this.buildPurchasedItems(userId);
    const match = items.find(
      (item) => item.orderId === orderId && item.productId === productId,
    );

    if (!match) {
      throw new NotFoundException('Purchased item not found in closet');
    }

    await this.repository.markPurchasedItemRemoved(
      userId,
      orderId,
      productId,
      new Date(match.purchasedAt),
    );

    return { removed: true };
  }

  async getSavedOutfits(userId) {
    const outfits = await this.repository.findSavedOutfits(userId);
    return outfits.map((outfit) => this.formatSavedOutfit(outfit));
  }

  async createSavedOutfitFromAvatar(userId, payload = {}) {
    const products = Array.isArray(payload.products) ? payload.products : [];
    const saved = await this.repository.createSavedOutfit(userId, {
      name: payload.name || 'Avatar Look',
      products,
      items: payload.items || products.map((product) => product.id).filter(Boolean),
      preview_image: payload.previewImage || payload.thumbnail || null,
      thumbnail: payload.thumbnail || payload.previewImage || null,
      total_price: payload.totalPrice ?? null,
      source: payload.source || 'digital-avatar',
    });

    return this.formatSavedOutfit(saved);
  }

  async getSavedOutfit(userId, outfitId) {
    const outfit = await this.repository.findSavedOutfitById(userId, outfitId);

    if (!outfit) {
      throw new NotFoundException('Saved outfit not found');
    }

    return this.formatSavedOutfit(outfit);
  }

  async updateSavedOutfit(userId, outfitId, { name, items } = {}) {
    const outfit = await this.repository.findSavedOutfitById(userId, outfitId);

    if (!outfit) {
      throw new NotFoundException('Saved outfit not found');
    }

    const data = {};

    if (name !== undefined) {
      data.name = name;
    }

    if (items !== undefined) {
      if (!Array.isArray(items)) {
        throw new BadRequestException('Outfit items must be an array');
      }

      data.items = items;
      data.products = items;
      data.total_price = sumOutfitPrice(items);
    }

    await this.repository.updateSavedOutfit(userId, outfitId, data);

    return this.getSavedOutfit(userId, outfitId);
  }

  async deleteOutfit(userId, outfitId) {
    const result = await this.repository.deleteSavedOutfit(userId, outfitId);

    if (!result.count) {
      throw new NotFoundException('Saved outfit not found');
    }

    return { deleted: true };
  }

  async addOutfitToCart(userId, outfitId) {
    const outfit = await this.getSavedOutfit(userId, outfitId);
    const products = extractOutfitProducts(outfit);

    for (const item of products) {
      const productId = item?.productId ?? item?.product_id ?? item?.id;

      if (productId) {
        await this.cartService.addItem(userId, {
          product_id: productId,
          quantity: item?.quantity || 1,
        });
      }
    }

    return { added: products.length };
  }

  async getFavoriteBrands(userId) {
    return this.computeFavoriteBrands(userId);
  }

  async removeFavoriteBrand(userId, brandName) {
    await this.repository.markFavoriteBrandRemoved(userId, brandName);
    return { removed: true };
  }

  async getFavoriteColors(userId) {
    return this.computeFavoriteColors(userId);
  }

  async removeFavoriteColor(userId, colorName) {
    await this.repository.markFavoriteColorRemoved(userId, colorName);
    return { removed: true };
  }

  async search(userId, query = {}) {
    const [purchased, outfits, brands] = await Promise.all([
      this.buildPurchasedItems(userId),
      this.getSavedOutfits(userId),
      this.computeFavoriteBrands(userId),
    ]);

    const term = query.q?.trim().toLowerCase() || '';
    const category = query.category?.trim().toLowerCase() || '';
    const brand = query.brand?.trim().toLowerCase() || '';
    const color = query.color?.trim().toLowerCase() || '';
    const minPrice = query.minPrice != null ? Number(query.minPrice) : null;
    const maxPrice = query.maxPrice != null ? Number(query.maxPrice) : null;

    let filteredProducts = purchased;

    if (term) {
      filteredProducts = filteredProducts.filter((item) => {
        const haystack = [
          item.name,
          item.brand,
          item.category,
          item.color,
        ].join(' ').toLowerCase();
        return haystack.includes(term);
      });
    }

    if (category) {
      filteredProducts = filteredProducts.filter(
        (item) => item.category?.toLowerCase().includes(category),
      );
    }

    if (brand) {
      filteredProducts = filteredProducts.filter(
        (item) => item.brand?.toLowerCase().includes(brand),
      );
    }

    if (color) {
      filteredProducts = filteredProducts.filter(
        (item) => item.color?.toLowerCase().includes(color),
      );
    }

    if (minPrice != null && Number.isFinite(minPrice)) {
      filteredProducts = filteredProducts.filter((item) => item.price >= minPrice);
    }

    if (maxPrice != null && Number.isFinite(maxPrice)) {
      filteredProducts = filteredProducts.filter((item) => item.price <= maxPrice);
    }

    if (query.recentlyAdded === 'true' || query.recentlyAdded === true) {
      filteredProducts = [...filteredProducts].sort(
        (a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt),
      );
    }

    const filteredOutfits = term
      ? outfits.filter((outfit) => outfit.name?.toLowerCase().includes(term))
      : outfits;

    const filteredBrands = term
      ? brands.filter((item) => item.brandName.toLowerCase().includes(term))
      : brands;

    const paginated = this.filterAndPaginatePurchased(filteredProducts, query);

    return {
      products: paginated.items,
      outfits: filteredOutfits,
      brands: filteredBrands,
      meta: paginated.meta,
    };
  }

  async buildPurchasedItems(userId) {
    const [orders, removedKeys] = await Promise.all([
      this.repository.findDeliveredOrders(userId),
      this.repository.findRemovedClosetKeys(userId),
    ]);

    const removedSet = new Set(
      removedKeys.map((row) => `${row.order_id}:${row.product_id}`),
    );

    const items = [];

    for (const order of orders) {
      const metadataItems = Array.isArray(order.metadata?.items)
        ? order.metadata.items
        : null;

      const lineItems = metadataItems?.length
        ? metadataItems
        : order.product
          ? [{
            product_id: order.product_id,
            quantity: 1,
            price: order.total_amount,
            product: order.product,
          }]
          : [];

      for (const [index, lineItem] of lineItems.entries()) {
        const productId = lineItem.product_id;
        const key = `${order.id}:${productId}`;

        if (removedSet.has(key)) {
          continue;
        }

        const product = lineItem.product
          ? formatCatalogProduct(lineItem.product)
          : (order.product ? formatCatalogProduct(order.product) : null);

        if (!product) {
          continue;
        }

        items.push({
          id: `${order.id}-${index}`,
          orderId: order.id,
          productId,
          name: product.name,
          brand: product.brand || 'Unknown',
          category: product.category || product.subcategory || 'General',
          size: resolveProductSize(product, lineItem),
          color: product.color || 'Unknown',
          price: lineItem.price ?? product.price ?? 0,
          currency: product.currency || 'USD',
          imageUrl: product.imageUrl || product.image_url,
          purchasedAt: order.updated_at || order.created_at,
          product,
        });
      }
    }

    return items.sort(
      (a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt),
    );
  }

  filterAndPaginatePurchased(items, query = {}) {
    let filtered = [...items];
    const search = query.search?.trim().toLowerCase();

    if (search) {
      filtered = filtered.filter((item) => {
        const haystack = [item.name, item.brand, item.category, item.color]
          .join(' ')
          .toLowerCase();
        return haystack.includes(search);
      });
    }

    if (query.category) {
      const category = query.category.toLowerCase();
      filtered = filtered.filter(
        (item) => item.category?.toLowerCase().includes(category),
      );
    }

    const minPrice = query.minPrice != null ? Number(query.minPrice) : null;
    const maxPrice = query.maxPrice != null ? Number(query.maxPrice) : null;

    if (minPrice != null && Number.isFinite(minPrice)) {
      filtered = filtered.filter((item) => item.price >= minPrice);
    }

    if (maxPrice != null && Number.isFinite(maxPrice)) {
      filtered = filtered.filter((item) => item.price <= maxPrice);
    }

    if (query.brand) {
      const brandTerm = query.brand.toLowerCase();
      filtered = filtered.filter(
        (item) => item.brand?.toLowerCase().includes(brandTerm),
      );
    }

    if (query.color) {
      const colorTerm = query.color.toLowerCase();
      filtered = filtered.filter(
        (item) => item.color?.toLowerCase().includes(colorTerm),
      );
    }

    const sort = query.sort || 'latest';

    if (sort === 'latest') {
      filtered.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));
    } else if (sort === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    const page = parsePage(query.page);
    const limit = parseLimit(query.limit);
    const total = filtered.length;
    const start = (page - 1) * limit;

    return {
      items: filtered.slice(start, start + limit),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  formatSavedOutfit(record) {
    const products = extractOutfitProducts(record);
    const thumbnail = record.thumbnail || record.preview_image;
    const totalPrice = record.total_price ?? sumOutfitPrice(products);

    return {
      id: record.id,
      userId: record.user_id,
      name: record.name || 'Saved Outfit',
      thumbnail,
      thumbnailUrl: thumbnail,
      previewImage: record.preview_image,
      previewImageUrl: record.preview_image,
      items: products,
      products,
      productCount: products.length,
      totalPrice,
      source: record.source || 'virtual-try-on',
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  async computeFavoriteBrands(userId) {
    const [purchased, wishlist, outfits, stored] = await Promise.all([
      this.buildPurchasedItems(userId),
      this.repository.findWishlistWithProducts(userId),
      this.repository.findSavedOutfits(userId),
      this.repository.findFavoriteBrands(userId),
    ]);

    const removed = new Set(
      stored.filter((row) => row.is_removed).map((row) => row.brand_name.toLowerCase()),
    );

    const brandStats = new Map();

    const track = (brand, category) => {
      const name = (brand || 'Unknown').trim();

      if (!name || name === 'Unknown') {
        return;
      }

      const key = name.toLowerCase();

      if (removed.has(key)) {
        return;
      }

      const current = brandStats.get(key) || {
        brandName: name,
        interactionCount: 0,
        categories: new Map(),
      };

      current.interactionCount += 1;

      if (category) {
        const catKey = category.toLowerCase();
        current.categories.set(catKey, (current.categories.get(catKey) || 0) + 1);
      }

      brandStats.set(key, current);
    };

    for (const item of purchased) {
      track(item.brand, item.category);
    }

    for (const row of wishlist) {
      track(row.product?.brand, row.product?.category);
    }

    for (const outfit of outfits) {
      for (const product of extractOutfitProducts(outfit)) {
        track(product.brand || product.brandName, product.category);
      }
    }

    const results = [];

    for (const stats of brandStats.values()) {
      let preferredCategory = 'Mixed';

      if (stats.categories.size) {
        preferredCategory = [...stats.categories.entries()]
          .sort((a, b) => b[1] - a[1])[0][0];
        preferredCategory = preferredCategory.charAt(0).toUpperCase()
          + preferredCategory.slice(1);
      }

      const payload = {
        interaction_count: stats.interactionCount,
        preferred_category: preferredCategory,
        is_removed: false,
      };

      const saved = await this.repository.upsertFavoriteBrand(
        userId,
        stats.brandName,
        payload,
      );

      results.push({
        id: saved.id,
        brandName: stats.brandName,
        logoUrl: saved.logo_url,
        interactionCount: stats.interactionCount,
        preferredCategory,
      });
    }

    return results.sort((a, b) => b.interactionCount - a.interactionCount);
  }

  async computeFavoriteColors(userId) {
    const [purchased, wishlist, outfits, stored] = await Promise.all([
      this.buildPurchasedItems(userId),
      this.repository.findWishlistWithProducts(userId),
      this.repository.findSavedOutfits(userId),
      this.repository.findFavoriteColors(userId),
    ]);

    const removed = new Set(
      stored.filter((row) => row.is_removed).map((row) => row.color_name.toLowerCase()),
    );

    const colorCounts = new Map();
    let total = 0;

    const track = (color) => {
      const normalized = normalizeColorName(color);

      if (!normalized || removed.has(normalized)) {
        return;
      }

      colorCounts.set(normalized, (colorCounts.get(normalized) || 0) + 1);
      total += 1;
    };

    for (const item of purchased) {
      track(item.color);
    }

    for (const row of wishlist) {
      track(row.product?.color);
    }

    for (const outfit of outfits) {
      for (const product of extractOutfitProducts(outfit)) {
        track(product.color || product.colorName);
      }
    }

    const results = [];

    for (const [normalized, count] of colorCounts.entries()) {
      const displayName = toDisplayColorName(normalized);
      const usagePercent = total
        ? Math.round((count / total) * 1000) / 10
        : 0;

      const saved = await this.repository.upsertFavoriteColor(userId, displayName, {
        hex_code: resolveColorHex(normalized),
        usage_percent: usagePercent,
        is_removed: false,
      });

      results.push({
        id: saved.id,
        colorName: displayName,
        hexCode: resolveColorHex(normalized),
        usagePercent,
      });
    }

    return results.sort((a, b) => b.usagePercent - a.usagePercent);
  }
}
