import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { normalizeProductQuery } from '../utils/normalize-product-query.util';
import { buildCatalogVisibilityFilter } from '../utils/catalog-visibility.util';

export @Injectable()
class ProductRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  findMany(query) {
    const normalizedQuery = normalizeProductQuery(query);
    const where = this.buildWhereClause(normalizedQuery);
    const orderBy = { [normalizedQuery.sortBy]: normalizedQuery.sortOrder };
    const skip = (normalizedQuery.page - 1) * normalizedQuery.limit;

    return this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: normalizedQuery.limit,
        include: { images: { orderBy: { sort_order: 'asc' } } },
      }),
      this.prisma.product.count({ where }),
    ]);
  }

  findById(id) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sort_order: 'asc' } } },
    });
  }

  findBySku(sku) {
    return this.prisma.product.findUnique({
      where: { sku },
      include: { images: { orderBy: { sort_order: 'asc' } } },
    });
  }

  countReferences(productId) {
    return this.prisma.$transaction([
      this.prisma.wishlist.count({ where: { product_id: productId } }),
      this.prisma.productView.count({ where: { product_id: productId } }),
      this.prisma.order.count({ where: { product_id: productId } }),
    ]).then(([wishlist, views, orders]) => wishlist + views + orders);
  }

  create(data, images = []) {
    return this.prisma.product.create({
      data: {
        ...data,
        images: images.length
          ? { create: this.mapImages(images) }
          : undefined,
      },
      include: { images: { orderBy: { sort_order: 'asc' } } },
    });
  }

  update(id, data, images) {
    const updateData = { ...data };

    if (images !== undefined) {
      updateData.images = {
        deleteMany: {},
        create: this.mapImages(images),
      };
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: { images: { orderBy: { sort_order: 'asc' } } },
    });
  }

  delete(id) {
    return this.prisma.product.delete({
      where: { id },
    });
  }

  buildWhereClause(query) {
    const and = [buildCatalogVisibilityFilter()];

    if (query.search) {
      and.push(this.buildTextSearchFilter(query.search));
    }

    if (query.category) {
      and.push({
        OR: [
          { category: { equals: query.category, mode: 'insensitive' } },
          { category_id: { equals: query.category, mode: 'insensitive' } },
          { subcategory: { equals: query.category, mode: 'insensitive' } },
        ],
      });
    } else if (query.category_id) {
      and.push({
        OR: [
          { category_id: { equals: query.category_id, mode: 'insensitive' } },
          { category: { equals: query.category_id, mode: 'insensitive' } },
          { subcategory: { equals: query.category_id, mode: 'insensitive' } },
        ],
      });
    }

    if (query.subcategory) {
      and.push({ subcategory: query.subcategory });
    }

    const productType = query.productType ?? query.product_type;
    if (productType) {
      and.push({ product_type: { equals: productType, mode: 'insensitive' } });
    }

    if (query.gender) {
      and.push({ gender: query.gender });
    }

    if (query.brand) {
      and.push({
        OR: [
          { brand: { equals: query.brand, mode: 'insensitive' } },
          { brand_id: { equals: query.brand, mode: 'insensitive' } },
        ],
      });
    } else if (query.brand_id) {
      and.push({
        OR: [
          { brand_id: { equals: query.brand_id, mode: 'insensitive' } },
          { brand: { equals: query.brand_id, mode: 'insensitive' } },
        ],
      });
    }

    if (query.color) {
      and.push({
        OR: [
          { color: { equals: query.color, mode: 'insensitive' } },
          { variants: { some: { color: { equals: query.color, mode: 'insensitive' } } } },
        ],
      });
    }

    const size = query.size;
    if (size) {
      and.push({
        OR: [
          { variants: { some: { size: { equals: size, mode: 'insensitive' } } } },
          { size_options: { array_contains: size } },
        ],
      });
    }

    if (query.avatarCategory) {
      and.push({ avatar_category: query.avatarCategory });
    }

    if (query.is_active !== undefined) {
      and[0] = { ...and[0], is_active: query.is_active };
    }

    const minPrice = query.min_price ?? query.minPrice;
    const maxPrice = query.max_price ?? query.maxPrice;

    if (minPrice !== undefined || maxPrice !== undefined) {
      const price = {};

      if (minPrice !== undefined) {
        price.gte = minPrice;
      }

      if (maxPrice !== undefined) {
        price.lte = maxPrice;
      }

      and.push({ price });
    }

    return { AND: and };
  }

  buildTextSearchFilter(term) {
    return {
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { sku: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { brand: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
        { subcategory: { contains: term, mode: 'insensitive' } },
        { product_type: { contains: term, mode: 'insensitive' } },
        { color: { contains: term, mode: 'insensitive' } },
        { fabric: { contains: term, mode: 'insensitive' } },
        { pattern: { contains: term, mode: 'insensitive' } },
        { fit_type: { contains: term, mode: 'insensitive' } },
      ],
    };
  }

  findSearchSuggestionProducts(term, limit = 8) {
    const where = {
      AND: [
        buildCatalogVisibilityFilter(),
        this.buildTextSearchFilter(term),
      ],
    };

    return this.prisma.product.findMany({
      where,
      orderBy: [
        { is_trending: 'desc' },
        { view_count: 'desc' },
        { created_at: 'desc' },
      ],
      take: limit,
      include: { images: { orderBy: { sort_order: 'asc' } } },
    });
  }

  findSearchFacetRows(term, limit = 60) {
    const where = {
      AND: [
        buildCatalogVisibilityFilter(),
        this.buildTextSearchFilter(term),
      ],
    };

    return this.prisma.product.findMany({
      where,
      select: {
        brand: true,
        category: true,
        subcategory: true,
        style_tags: true,
        tags: true,
        cms_metadata: true,
        product_type: true,
      },
      take: limit,
    });
  }

  findTrendingProducts(limit = 6) {
    return this.prisma.product.findMany({
      where: {
        AND: [
          buildCatalogVisibilityFilter(),
          { OR: [{ is_trending: true }, { is_best_seller: true }] },
        ],
      },
      orderBy: [
        { is_trending: 'desc' },
        { view_count: 'desc' },
      ],
      take: limit,
      include: { images: { orderBy: { sort_order: 'asc' } } },
    });
  }

  findPopularBrands(limit = 6) {
    return this.prisma.product.groupBy({
      by: ['brand'],
      where: {
        AND: [
          buildCatalogVisibilityFilter(),
          { brand: { not: null } },
        ],
      },
      _count: { brand: true },
      orderBy: { _count: { brand: 'desc' } },
      take: limit,
    });
  }

  findTrendingSearchQueries(limit = 5) {
    return this.prisma.searchHistory.groupBy({
      by: ['query'],
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: limit,
    });
  }

  mapImages(images) {
    return images.map((image, index) => ({
      url: image.url,
      sort_order: image.sort_order ?? index,
      is_primary: image.is_primary ?? index === 0,
    }));
  }
}
