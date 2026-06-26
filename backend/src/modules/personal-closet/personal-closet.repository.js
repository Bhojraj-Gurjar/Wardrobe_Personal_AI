import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ORDER_STATUS } from '../orders/validators/order.constants';

const PRODUCT_INCLUDE = {
  images: { orderBy: { sort_order: 'asc' } },
};

const ORDER_INCLUDE = {
  product: { include: PRODUCT_INCLUDE },
};

export @Injectable()
class PersonalClosetRepository {
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
  }

  findDeliveredOrders(userId) {
    return this.prisma.order.findMany({
      where: {
        user_id: userId,
        status: ORDER_STATUS.DELIVERED,
      },
      include: ORDER_INCLUDE,
      orderBy: { updated_at: 'desc' },
    });
  }

  findRemovedClosetKeys(userId) {
    return this.prisma.personalClosetItem.findMany({
      where: {
        user_id: userId,
        is_removed: true,
      },
      select: {
        order_id: true,
        product_id: true,
      },
    });
  }

  markPurchasedItemRemoved(userId, orderId, productId, purchasedAt) {
    return this.prisma.personalClosetItem.upsert({
      where: {
        user_id_order_id_product_id: {
          user_id: userId,
          order_id: orderId,
          product_id: productId,
        },
      },
      create: {
        user_id: userId,
        order_id: orderId,
        product_id: productId,
        is_removed: true,
        purchased_at: purchasedAt,
      },
      update: {
        is_removed: true,
      },
    });
  }

  findWishlistWithProducts(userId) {
    return this.prisma.wishlist.findMany({
      where: { user_id: userId },
      include: {
        product: { include: PRODUCT_INCLUDE },
      },
    });
  }

  findSavedOutfits(userId) {
    return this.prisma.savedOutfit.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  findSavedOutfitById(userId, outfitId) {
    return this.prisma.savedOutfit.findFirst({
      where: { id: outfitId, user_id: userId },
    });
  }

  updateSavedOutfit(userId, outfitId, data) {
    return this.prisma.savedOutfit.updateMany({
      where: { id: outfitId, user_id: userId },
      data,
    });
  }

  deleteSavedOutfit(userId, outfitId) {
    return this.prisma.savedOutfit.deleteMany({
      where: { id: outfitId, user_id: userId },
    });
  }

  createSavedOutfit(userId, data) {
    return this.prisma.savedOutfit.create({
      data: {
        user_id: userId,
        name: data.name,
        products: data.products || [],
        items: data.items || [],
        preview_image: data.preview_image || null,
        thumbnail: data.thumbnail || null,
        total_price: data.total_price ?? null,
        source: data.source || 'digital-avatar',
      },
    });
  }

  findFavoriteBrands(userId) {
    return this.prisma.favoriteBrand.findMany({
      where: { user_id: userId },
    });
  }

  upsertFavoriteBrand(userId, brandName, data) {
    return this.prisma.favoriteBrand.upsert({
      where: {
        user_id_brand_name: {
          user_id: userId,
          brand_name: brandName,
        },
      },
      create: {
        user_id: userId,
        brand_name: brandName,
        ...data,
      },
      update: data,
    });
  }

  markFavoriteBrandRemoved(userId, brandName) {
    return this.prisma.favoriteBrand.updateMany({
      where: {
        user_id: userId,
        brand_name: brandName,
      },
      data: { is_removed: true },
    });
  }

  findFavoriteColors(userId) {
    return this.prisma.favoriteColor.findMany({
      where: { user_id: userId },
    });
  }

  upsertFavoriteColor(userId, colorName, data) {
    return this.prisma.favoriteColor.upsert({
      where: {
        user_id_color_name: {
          user_id: userId,
          color_name: colorName,
        },
      },
      create: {
        user_id: userId,
        color_name: colorName,
        ...data,
      },
      update: data,
    });
  }

  markFavoriteColorRemoved(userId, colorName) {
    return this.prisma.favoriteColor.updateMany({
      where: {
        user_id: userId,
        color_name: colorName,
      },
      data: { is_removed: true },
    });
  }

  findProductsByIds(productIds) {
    if (!productIds.length) {
      return [];
    }

    return this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: PRODUCT_INCLUDE,
    });
  }
}
