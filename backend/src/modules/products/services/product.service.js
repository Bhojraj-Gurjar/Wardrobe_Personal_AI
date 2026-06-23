import {
  Inject,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';
import { AiService } from '../../ai/services/ai.service';
import {
  formatCatalogProduct,
  mapCreateOrUpdateProductData,
  resolveCatalogImages,
} from '../utils/product-catalog.mapper';
import { normalizeProductQuery } from '../utils/normalize-product-query.util';
import {
  isCatalogSku,
  resolveStableProductId,
} from '../utils/product-identity.util';

export @Injectable()
class ProductService {
  constructor(
    @Inject(ProductRepository) productRepository,
    @Inject(AiService) aiService,
  ) {
    this.productRepository = productRepository;
    this.aiService = aiService;
  }

  async findAll(query) {
    const normalizedQuery = normalizeProductQuery(query);
    const [products, total] = await this.productRepository.findMany(normalizedQuery);

    return this.buildPaginatedResponse(products, total, normalizedQuery);
  }

  async findByCategory(category, query) {
    const normalizedQuery = normalizeProductQuery({
      ...query,
      category: decodeURIComponent(category),
    });
    const [products, total] = await this.productRepository.findMany(normalizedQuery);

    return this.buildPaginatedResponse(products, total, normalizedQuery);
  }

  async search(query) {
    const normalizedQuery = normalizeProductQuery(query);
    const searchTerm = (normalizedQuery.q ?? normalizedQuery.search)?.trim();

    if (!searchTerm) {
      throw new BadRequestException('Search query is required (use q or search)');
    }

    const [products, total] = await this.productRepository.findMany({
      ...normalizedQuery,
      search: searchTerm,
    });

    return this.buildPaginatedResponse(products, total, normalizedQuery);
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
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.formatProduct(product);
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

    if (isCatalogSku(dto.sku)) {
      createData.id = resolveStableProductId(dto.sku);
    }

    const product = await this.productRepository.create(
      createData,
      resolveCatalogImages(dto),
    );

    this.scheduleEmbedding(product);

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

    return this.formatProduct(product);
  }

  async remove(id) {
    const product = await this.ensureProductExists(id);
    const referenceCount = await this.productRepository.countReferences(id);

    if (isCatalogSku(product.sku) || referenceCount > 0) {
      const deactivated = await this.productRepository.update(id, {
        is_active: false,
      });

      return {
        message: 'Product deactivated to preserve wishlist and recommendation references',
        product: this.formatProduct(deactivated),
      };
    }

    await this.productRepository.delete(id);

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
