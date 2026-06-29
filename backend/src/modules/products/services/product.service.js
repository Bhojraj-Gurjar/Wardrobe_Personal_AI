import {
  Inject,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApiCacheService } from '../../../common/services/api-cache.service';
import { ProductRepository } from '../repositories/product.repository';
import { AiService } from '../../ai/services/ai.service';
import {
  formatCatalogProduct,
  mapCreateOrUpdateProductData,
  resolveCatalogImages,
} from '../utils/product-catalog.mapper';
import { normalizeProductQuery } from '../utils/normalize-product-query.util';
import { inferProductType } from '../constants/product-type.constants';
import {
  isCatalogSku,
  resolveStableProductId,
} from '../utils/product-identity.util';

export @Injectable()
class ProductService {
  constructor(
    @Inject(ProductRepository) productRepository,
    @Inject(AiService) aiService,
    @Inject(ApiCacheService) apiCacheService,
  ) {
    this.productRepository = productRepository;
    this.aiService = aiService;
    this.apiCacheService = apiCacheService;
    this.productListTtlSeconds = 300;
    this.productDetailTtlSeconds = 600;
  }

  buildListCacheKey(query) {
    return this.apiCacheService.buildKey(
      'products:list',
      JSON.stringify(query),
    );
  }

  async findAll(query) {
    const normalizedQuery = normalizeProductQuery(query);

    return this.apiCacheService.getOrSet(
      this.buildListCacheKey(normalizedQuery),
      this.productListTtlSeconds,
      async () => {
        const [products, total] = await this.productRepository.findMany(normalizedQuery);
        return this.buildPaginatedResponse(products, total, normalizedQuery);
      },
    );
  }

  async findByCategory(category, query) {
    const normalizedQuery = normalizeProductQuery({
      ...query,
      category: decodeURIComponent(category),
    });

    return this.apiCacheService.getOrSet(
      this.buildListCacheKey(normalizedQuery),
      this.productListTtlSeconds,
      async () => {
        const [products, total] = await this.productRepository.findMany(normalizedQuery);
        return this.buildPaginatedResponse(products, total, normalizedQuery);
      },
    );
  }

  async search(query) {
    const normalizedQuery = normalizeProductQuery(query);
    const searchTerm = (normalizedQuery.q ?? normalizedQuery.search)?.trim();

    if (!searchTerm) {
      throw new BadRequestException('Search query is required (use q or search)');
    }

    return this.apiCacheService.getOrSet(
      this.apiCacheService.buildKey('products:search', searchTerm, JSON.stringify(normalizedQuery)),
      120,
      async () => {
        const [products, total] = await this.productRepository.findMany({
          ...normalizedQuery,
          search: searchTerm,
        });

        return this.buildPaginatedResponse(products, total, normalizedQuery);
      },
    );
  }

  buildPaginatedResponse(products, total, query) {
    return {
      items: products.map((product) => this.formatProduct(product)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findOne(id) {
    return this.apiCacheService.getOrSet(
      this.apiCacheService.buildKey('products:detail', id),
      this.productDetailTtlSeconds,
      async () => {
        const product = await this.productRepository.findById(id);

        if (!product) {
          throw new NotFoundException('Product not found');
        }

        return this.formatProduct(product);
      },
    );
  }

  async invalidateCatalogCache(productId = null) {
    await Promise.all([
      this.apiCacheService.invalidateByPrefix('products:list'),
      this.apiCacheService.invalidateByPrefix('products:search'),
      this.apiCacheService.invalidateByPrefix('recommendations'),
    ]);

    if (productId) {
      await this.apiCacheService.invalidate(
        this.apiCacheService.buildKey('products:detail', productId),
      );
    }
  }

  async findBySku(sku) {
    const product = await this.productRepository.findBySku(sku);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.formatProduct(product);
  }

  async create(dto) {
    await this.ensureSkuAvailable(dto.sku);

    const createData = mapCreateOrUpdateProductData(dto);

    if (!createData.product_type) {
      createData.product_type = dto.productType || inferProductType(dto);
    }

    if (isCatalogSku(dto.sku)) {
      createData.id = resolveStableProductId(dto.sku);
    }

    const product = await this.productRepository.create(
      createData,
      resolveCatalogImages(dto),
    );

    this.scheduleEmbedding(product);

    await this.invalidateCatalogCache(product.id);

    return this.formatProduct(product);
  }

  async update(id, dto) {
    const existing = await this.ensureProductExists(id);

    if (dto.sku !== undefined && dto.sku !== existing.sku) {
      throw new BadRequestException('SKU is immutable after product creation');
    }

    const images = dto.images !== undefined || dto.imageUrl !== undefined
      ? resolveCatalogImages(dto)
      : undefined;

    const product = await this.productRepository.update(
      id,
      mapCreateOrUpdateProductData(dto, { allowSku: false }),
      images,
    );

    await this.invalidateCatalogCache(id);

    return this.formatProduct(product);
  }

  async remove(id) {
    await this.ensureProductExists(id);

    await this.productRepository.delete(id);
    await this.invalidateCatalogCache(id);

    return { message: 'Product deleted successfully' };
  }

  async ensureProductExists(id) {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async ensureSkuAvailable(sku, excludeId) {
    const existing = await this.productRepository.findBySku(sku);

    if (existing && existing.id !== excludeId) {
      throw new ConflictException('SKU already exists');
    }
  }

  scheduleEmbedding(product) {
    if (!this.aiService.isConfigured()) {
      return;
    }

    this.aiService
      .embedProduct({
        product_id: product.id,
        product: {
          name: product.name,
          description: product.description,
          sku: product.sku,
          category: product.category ?? product.category_id,
          brand: product.brand ?? product.brand_id,
        },
      })
      .catch(() => null);
  }

  formatProduct(product) {
    return formatCatalogProduct(product);
  }
}
