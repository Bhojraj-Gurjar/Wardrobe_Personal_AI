import { Inject, BadRequestException, ConflictException,
  Injectable,
  NotFoundException, } from '@nestjs/common';
import { REFRESH_SOURCES } from '../../fashion-dna/constants/fashion-dna-regeneration.constants';
import { FashionDnaRegenerationService } from '../../fashion-dna/services/fashion-dna-regeneration.service';
import { ProductRepository } from '../../products/repositories/product.repository';
import { formatCatalogProduct } from '../../products/utils/product-catalog.mapper';
import { WishlistRepository } from '../repositories/wishlist.repository';

export @Injectable()
class WishlistService {
  constructor(
    @Inject(WishlistRepository) wishlistRepository,
    @Inject(FashionDnaRegenerationService) fashionDnaRegenerationService,
    @Inject(ProductRepository) productRepository,
  ) {
    this.wishlistRepository = wishlistRepository;
    this.fashionDnaRegenerationService = fashionDnaRegenerationService;
    this.productRepository = productRepository;
  }

  async getWishlist(userId) {
    const items = await this.wishlistRepository.findByUserId(userId);

    return {
      items: items.map((item) => this.formatWishlistItem(item)),
    };
  }

  async addToWishlist(userId, dto) {
    const productId = await this.resolveProductId(dto);

    const existing = await this.wishlistRepository.findByUserAndProduct(
      userId,
      productId,
    );

    if (existing) {
      throw new ConflictException('Product already in wishlist');
    }

    const item = await this.wishlistRepository.create(userId, productId);

    this.fashionDnaRegenerationService.trigger(
      userId,
      REFRESH_SOURCES.WISHLIST_UPDATE,
    );

    return this.formatWishlistItem(item);
  }

  async removeFromWishlist(userId, id) {
    const item = await this.wishlistRepository.findByIdAndUserId(id, userId);

    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }

    await this.wishlistRepository.delete(id);

    this.fashionDnaRegenerationService.trigger(
      userId,
      REFRESH_SOURCES.WISHLIST_UPDATE,
    );

    return { message: 'Removed from wishlist successfully' };
  }

  async resolveProductId(dto) {
    if (dto.product_id) {
      const exists = await this.wishlistRepository.productExists(dto.product_id);

      if (!exists) {
        throw new NotFoundException('Product not found');
      }

      return dto.product_id;
    }

    if (dto.sku) {
      const product = await this.productRepository.findBySku(dto.sku);

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return product.id;
    }

    throw new BadRequestException('product_id or sku is required');
  }

  formatWishlistItem(item) {
    return {
      id: item.id,
      user_id: item.user_id,
      product_id: item.product_id,
      product_sku: item.product?.sku ?? null,
      created_at: item.created_at,
      product: this.formatProduct(item.product),
    };
  }

  formatProduct(product) {
    if (!product) {
      return null;
    }

    return formatCatalogProduct(product);
  }
}
