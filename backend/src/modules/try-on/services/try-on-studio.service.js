import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductRepository } from '../../products/repositories/product.repository';
import { formatCatalogProduct } from '../../products/utils/product-catalog.mapper';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { TryOnBodyResolverService } from './try-on-body-resolver.service';
import { TryOnService } from '../try-on.service';
import { TryOnResultRepository } from '../repositories/try-on-result.repository';
import {
  assessTryOnCompatibility,
  formatTryOnCatalogProduct,
} from '../utils/try-on-product-compatibility.util';

function resolvePagination(page, limit, defaultLimit = 24) {
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

export @Injectable()
class TryOnStudioService {
  constructor(
    @Inject(TryOnBodyResolverService) bodyResolver,
    @Inject(TryOnService) tryOnService,
    @Inject(ProductRepository) productRepository,
    @Inject(TryOnResultRepository) resultRepository,
    @Inject(StoragePathResolver) storagePathResolver,
  ) {
    this.bodyResolver = bodyResolver;
    this.tryOnService = tryOnService;
    this.productRepository = productRepository;
    this.resultRepository = resultRepository;
    this.storagePathResolver = storagePathResolver;
  }

  getSetup(userId) {
    return this.bodyResolver.getSetup(userId);
  }

  async listProducts(userId, query = {}) {
    const { page, limit } = resolvePagination(query.page, query.limit, 48);
    const compatibleOnly = String(query.compatibleOnly || query.compatible_only || '')
      .toLowerCase() === 'true';

    const [products, total] = await this.productRepository.findMany({
      page,
      limit: compatibleOnly ? 100 : limit,
      search: query.search,
      category: query.category,
      is_active: true,
    });

    const mapped = products.map((product) => formatTryOnCatalogProduct(
      product,
      this.storagePathResolver,
    ));

    let filtered = compatibleOnly
      ? mapped.filter((product) => product.isTryOnCompatible)
      : mapped;

    let compatibleFallbackApplied = false;

    if (
      compatibleOnly
      && filtered.length === 0
      && !query.search
      && !query.category
    ) {
      compatibleFallbackApplied = true;
      filtered = mapped;
    }

    const items = compatibleOnly && !compatibleFallbackApplied
      ? filtered.slice((page - 1) * limit, page * limit)
      : filtered;

    return {
      products: items,
      meta: {
        total: compatibleOnly && !compatibleFallbackApplied ? filtered.length : total,
        page,
        limit,
        totalPages: Math.ceil(
          (compatibleOnly && !compatibleFallbackApplied ? filtered.length : total) / limit,
        ) || 1,
        compatibleFallbackApplied,
      },
    };
  }

  async generateWithProduct(userId, productId) {
    const setup = await this.bodyResolver.getSetup(userId);

    if (!setup.ready || !setup.bodyPhotoUrl) {
      throw new BadRequestException(setup.message || 'Onboarding body photo is required.');
    }

    const product = await this.productRepository.findById(productId);

    if (!product || !product.is_active) {
      throw new NotFoundException('Product not found');
    }

    const compatibility = assessTryOnCompatibility(product);

    if (!compatibility.isTryOnCompatible || !compatibility.tryOnImage) {
      throw new BadRequestException('Selected product is not compatible with virtual try-on.');
    }

    const garmentImageUrl = this.storagePathResolver.toPublicUrl(compatibility.tryOnImage)
      || compatibility.tryOnImage;

    const catvtonResult = await this.tryOnService.generateTryOn(
      userId,
      setup.bodyPhotoUrl,
      garmentImageUrl,
      { persistHistory: false },
    );

    const generatedImageUrl =
      catvtonResult?.resultImageUrl
      || catvtonResult?.result_image_url
      || null;

    const record = await this.resultRepository.create(userId, {
      productId: product.id,
      bodyImage: setup.bodyPhotoReference,
      garmentImage: garmentImageUrl,
      generatedImage: generatedImageUrl,
    });

    return {
      result: this.formatResult(record),
      bodyPhotoUrl: setup.bodyPhotoUrl,
      generatedImageUrl,
      product: formatTryOnCatalogProduct(product, this.storagePathResolver),
    };
  }

  async listResults(userId) {
    const records = await this.resultRepository.findManyByUserId(userId);
    return records.map((record) => this.formatResult(record));
  }

  async saveResultOutfit(userId, resultId, { name } = {}) {
    const record = await this.resultRepository.findById(userId, resultId);

    if (!record) {
      throw new NotFoundException('Try-on result not found');
    }

    const product = record.product
      ? formatCatalogProduct(record.product)
      : null;
    const products = product ? [product] : [];

    const saved = await this.resultRepository.createSavedOutfit(userId, {
      name: name || `Try-On ${new Date(record.created_at).toLocaleDateString()}`,
      products,
      items: products,
      preview_image: record.generated_image,
      thumbnail: record.generated_image,
      total_price: product?.price || 0,
      source: 'try-on',
    });

    return {
      id: saved.id,
      name: saved.name,
      previewImage: saved.preview_image,
      totalPrice: saved.total_price,
      source: saved.source,
      createdAt: saved.created_at,
    };
  }

  async addResultToCloset(userId, resultId) {
    return this.saveResultOutfit(userId, resultId, {
      name: `Closet Look ${new Date().toLocaleDateString()}`,
    });
  }

  formatResult(record) {
    const product = record.product
      ? formatTryOnCatalogProduct(record.product, this.storagePathResolver)
      : null;

    return {
      id: record.id,
      userId: record.user_id,
      productId: record.product_id,
      bodyImage: record.body_image,
      bodyPhotoUrl: this.bodyResolver.toPublicUrl(record.body_image),
      garmentImage: record.garment_image,
      garmentImageUrl: record.garment_image,
      generatedImage: record.generated_image,
      generatedImageUrl: record.generated_image,
      product,
      createdAt: record.created_at,
    };
  }
}
