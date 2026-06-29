import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { buildAdminProductListFilter } from '../../products/utils/catalog-visibility.util';

const PRODUCT_DETAIL_INCLUDE = {
  images: { orderBy: { sort_order: 'asc' } },
  variants: { orderBy: [{ sort_order: 'asc' }, { color: 'asc' }, { size: 'asc' }] },
  inventory_history: {
    orderBy: { created_at: 'desc' },
    take: 15,
  },
};

const PRODUCT_LIST_INCLUDE = {
  images: { orderBy: { sort_order: 'asc' }, take: 1 },
  variants: { select: { id: true, color: true, size: true, stock: true, sku: true } },
  orders: { select: { id: true } },
};

function resolvePagination(page, limit, defaultLimit = 20) {
  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const limitNum = Math.min(
    100,
    Math.max(1, Number.parseInt(limit, 10) || defaultLimit),
  );

  return {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum,
  };
}

function resolveSort(sortBy, sortOrder) {
  const allowed = {
    createdAt: 'created_at',
    name: 'name',
    price: 'price',
    stock: 'stock_quantity',
    brand: 'brand',
    category: 'category',
  };

  const field = allowed[sortBy] || 'created_at';
  const order = String(sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

  return { [field]: order };
}

export @Injectable()
class AdminProductCmsRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  findProducts(query) {
    const where = this.buildWhereClause(query);
    const { skip, limit: take, page } = resolvePagination(query.page, query.limit);
    const orderBy = resolveSort(query.sortBy, query.sortOrder);

    return this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_LIST_INCLUDE,
        orderBy,
        skip,
        take,
      }),
      this.prisma.product.count({ where }),
    ]).then(([products, total]) => ({ products, total, page, limit: take }));
  }

  findProductById(id) {
    const productId = String(id ?? '').trim();

    if (!productId) {
      return Promise.resolve(null);
    }

    return this.prisma.product.findUnique({
      where: { id: productId },
      include: PRODUCT_DETAIL_INCLUDE,
    }).catch((error) => {
      if (this.isInvalidProductIdError(error)) {
        return null;
      }

      throw error;
    });
  }

  isInvalidProductIdError(error) {
    const message = String(error?.message || '').toLowerCase();

    return error?.code === 'P2023'
      || message.includes('invalid uuid')
      || message.includes('error creating uuid')
      || message.includes('inconsistent column data');
  }

  findProductBySku(sku) {
    return this.prisma.product.findUnique({
      where: { sku },
      select: { id: true, sku: true },
    });
  }

  findVariantBySku(sku) {
    return this.prisma.productVariant.findUnique({
      where: { sku },
      select: { id: true, sku: true, product_id: true },
    });
  }

  findByBarcode(barcode) {
    if (!barcode) {
      return null;
    }

    return this.prisma.product.findFirst({
      where: { barcode },
      select: { id: true, barcode: true },
    });
  }

  createProductWithRelations({ productData, images, variants }) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: productData,
      });

      if (images?.length) {
        await tx.productImage.createMany({
          data: images.map((image, index) => ({
            product_id: product.id,
            url: image.url,
            sort_order: image.sortOrder ?? index,
            is_primary: image.isPrimary ?? index === 0,
          })),
        });
      }

      if (variants?.length) {
        await tx.productVariant.createMany({
          data: variants.map((variant, index) => ({
            product_id: product.id,
            color: variant.color,
            size: variant.size,
            sku: variant.sku,
            stock: variant.stock ?? 0,
            price_override: variant.priceOverride ?? null,
            image_url: variant.imageUrl ?? null,
            barcode: variant.barcode ?? null,
            sort_order: variant.sortOrder ?? index,
          })),
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: PRODUCT_DETAIL_INCLUDE,
      });
    });
  }

  updateProductWithRelations(id, { productData, images, variants }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: productData,
      });

      if (images !== undefined) {
        await tx.productImage.deleteMany({ where: { product_id: id } });
        if (images.length) {
          await tx.productImage.createMany({
            data: images.map((image, index) => ({
              product_id: id,
              url: image.url,
              sort_order: image.sortOrder ?? index,
              is_primary: image.isPrimary ?? index === 0,
            })),
          });
        }
      }

      if (variants !== undefined) {
        await tx.productVariant.deleteMany({ where: { product_id: id } });
        if (variants.length) {
          await tx.productVariant.createMany({
            data: variants.map((variant, index) => ({
              product_id: id,
              color: variant.color,
              size: variant.size,
              sku: variant.sku,
              stock: variant.stock ?? 0,
              price_override: variant.priceOverride ?? null,
              image_url: variant.imageUrl ?? null,
              barcode: variant.barcode ?? null,
              sort_order: variant.sortOrder ?? index,
            })),
          });
        }
      }

      return tx.product.findUnique({
        where: { id },
        include: PRODUCT_DETAIL_INCLUDE,
      });
    });
  }

  adjustInventory({ productId, variantId, changeType, quantityChange, reason, adminUserId }) {
    return this.prisma.$transaction(async (tx) => {
      let quantityBefore = 0;
      let quantityAfter = 0;

      if (variantId) {
        const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
        if (!variant || variant.product_id !== productId) {
          return null;
        }

        quantityBefore = variant.stock;
        quantityAfter = Math.max(0, quantityBefore + quantityChange);

        await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: quantityAfter },
        });
      } else {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) {
          return null;
        }

        quantityBefore = product.stock_quantity;
        quantityAfter = Math.max(0, quantityBefore + quantityChange);

        await tx.product.update({
          where: { id: productId },
          data: { stock_quantity: quantityAfter },
        });
      }

      const totalStock = await this.sumProductStock(tx, productId);

      await tx.product.update({
        where: { id: productId },
        data: { stock_quantity: totalStock },
      });

      const history = await tx.productInventoryHistory.create({
        data: {
          product_id: productId,
          variant_id: variantId ?? null,
          change_type: changeType,
          quantity_change: quantityChange,
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          reason: reason ?? null,
          admin_user_id: adminUserId ?? null,
        },
      });

      return tx.product.findUnique({
        where: { id: productId },
        include: PRODUCT_DETAIL_INCLUDE,
      }).then((product) => ({ product, history }));
    });
  }

  async sumProductStock(tx, productId) {
    const variants = await tx.productVariant.findMany({
      where: { product_id: productId, is_active: true },
      select: { stock: true },
    });

    if (variants.length) {
      return variants.reduce((sum, variant) => sum + variant.stock, 0);
    }

    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { stock_quantity: true },
    });

    return product?.stock_quantity ?? 0;
  }

  getInventoryHistory(productId, limit = 50) {
    return this.prisma.productInventoryHistory.findMany({
      where: { product_id: productId },
      orderBy: { created_at: 'desc' },
      take: Math.min(100, limit),
    });
  }

  async getInventoryHistoryWithAdmin(productId, limit = 15) {
    const resolvedProductId = String(productId ?? '').trim();

    if (!resolvedProductId) {
      return [];
    }

    try {
      const history = await this.getInventoryHistory(resolvedProductId, limit);
      const adminIds = [
        ...new Set(history.map((entry) => entry.admin_user_id).filter(Boolean)),
      ];

      const admins = adminIds.length
        ? await this.prisma.user.findMany({
          where: { id: { in: adminIds } },
          select: { id: true, name: true, email: true },
        })
        : [];

      const adminMap = new Map(
        admins.map((admin) => [admin.id, admin.name || admin.email || 'Admin']),
      );

      return history.map((entry) => ({
        ...entry,
        adminName: entry.admin_user_id
          ? adminMap.get(entry.admin_user_id) || 'Admin'
          : 'System',
      }));
    } catch {
      return [];
    }
  }

  fetchProductAnalytics(productId) {
    const resolvedProductId = String(productId ?? '').trim();

    if (!resolvedProductId) {
      return Promise.resolve({
        views: 0,
        wishlistCount: 0,
        orders: 0,
      });
    }

    return Promise.all([
      this.prisma.productView.count({ where: { product_id: resolvedProductId } }).catch(() => 0),
      this.prisma.wishlist.count({ where: { product_id: resolvedProductId } }).catch(() => 0),
      this.prisma.order.count({
        where: { product_id: resolvedProductId, status: 'DELIVERED' },
      }).catch(() => 0),
    ]).then(([views, wishlistCount, orders]) => ({
      views: views ?? 0,
      wishlistCount: wishlistCount ?? 0,
      orders: orders ?? 0,
    }));
  }

  buildActiveProductFilter() {
    return buildAdminProductListFilter();
  }

  deleteProductById(id) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!product) {
        return null;
      }

      await tx.personalClosetItem.deleteMany({ where: { product_id: id } });
      await tx.cartItem.deleteMany({ where: { product_id: id } });
      await tx.wishlist.deleteMany({ where: { product_id: id } });
      await tx.productView.deleteMany({ where: { product_id: id } });

      return tx.product.delete({ where: { id } });
    });
  }

  archiveProductById(id) {
    return this.prisma.product.findUnique({ where: { id } }).then((product) => {
      if (!product) {
        return null;
      }

      const existingMetadata = product.cms_metadata && typeof product.cms_metadata === 'object'
        ? product.cms_metadata
        : {};

      return this.prisma.product.update({
        where: { id },
        data: {
          is_active: false,
          visibility: 'HIDDEN',
          cms_metadata: {
            ...existingMetadata,
            adminDeleted: true,
            deletedAt: new Date().toISOString(),
          },
        },
      });
    });
  }

  buildWhereClause(query) {
    const and = [this.buildActiveProductFilter()];

    if (query.search) {
      const term = query.search.trim();
      and.push({
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { brand: { contains: term, mode: 'insensitive' } },
          { sku: { contains: term, mode: 'insensitive' } },
          { category: { contains: term, mode: 'insensitive' } },
          { product_type: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    if (query.category) {
      and.push({ category: { equals: query.category, mode: 'insensitive' } });
    }

    if (query.productType) {
      and.push({ product_type: { equals: query.productType, mode: 'insensitive' } });
    }

    if (query.brand) {
      and.push({ brand: { equals: query.brand, mode: 'insensitive' } });
    }

    if (query.gender) {
      and.push({ gender: { equals: query.gender, mode: 'insensitive' } });
    }

    if (query.visibility) {
      and.push({ visibility: query.visibility.toUpperCase() });
    }

    if (query.status === 'active') {
      and.push({ is_active: true });
    } else if (query.status === 'inactive') {
      and.push({ is_active: false });
    }

    if (query.stock === 'low') {
      and.push({ stock_quantity: { lte: 10, gt: 0 } });
    } else if (query.stock === 'out') {
      and.push({ stock_quantity: { lte: 0 } });
    } else if (query.stock === 'in') {
      and.push({ stock_quantity: { gt: 0 } });
    }

    return { AND: and };
  }
}
