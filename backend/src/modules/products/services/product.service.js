import { Inject, ConflictException,
  Injectable,
  NotFoundException, } from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';

export @Injectable()
class ProductService {
  constructor(@Inject(ProductRepository) productRepository) {
    this.productRepository = productRepository;
  }

  async findAll(query) {
    const [products, total] = await this.productRepository.findMany(query);

    return {
      items: products.map((product) => this.formatProduct(product)),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  async findOne(id) {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.formatProduct(product);
  }

  async create(dto) {
    await this.ensureSkuAvailable(dto.sku);

    const product = await this.productRepository.create(
      this.mapProductFields(dto),
      dto.images || [],
    );

    return this.formatProduct(product);
  }

  async update(id, dto) {
    await this.ensureProductExists(id);

    if (dto.sku) {
      await this.ensureSkuAvailable(dto.sku, id);
    }

    const product = await this.productRepository.update(
      id,
      this.mapProductFields(dto),
      dto.images,
    );

    return this.formatProduct(product);
  }

  async remove(id) {
    await this.ensureProductExists(id);
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

  mapProductFields(dto) {
    const data = {};

    if (dto.sku !== undefined) {
      data.sku = dto.sku;
    }

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.category_id !== undefined) {
      data.category_id = dto.category_id;
    }

    if (dto.brand_id !== undefined) {
      data.brand_id = dto.brand_id;
    }

    if (dto.price !== undefined) {
      data.price = dto.price;
    }

    return data;
  }

  formatProduct(product) {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      category_id: product.category_id,
      brand_id: product.brand_id,
      price: product.price,
      images: (product.images || []).map((image) => ({
        id: image.id,
        url: image.url,
        sort_order: image.sort_order,
        is_primary: image.is_primary,
        created_at: image.created_at,
      })),
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
  }
}
