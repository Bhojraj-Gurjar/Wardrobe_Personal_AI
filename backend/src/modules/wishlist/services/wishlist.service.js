import { Inject, ConflictException,
  Injectable,
  NotFoundException, } from '@nestjs/common';
import { WishlistRepository } from '../repositories/wishlist.repository';

export @Injectable()
class WishlistService {
  constructor(@Inject(WishlistRepository) wishlistRepository) {
    this.wishlistRepository = wishlistRepository;
  }

  async getWishlist(userId) {
    const items = await this.wishlistRepository.findByUserId(userId);

    return {
      items: items.map((item) => this.formatWishlistItem(item)),
    };
  }

  async addToWishlist(userId, dto) {
    const productExists = await this.wishlistRepository.productExists(
      dto.product_id,
    );

    if (!productExists) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.wishlistRepository.findByUserAndProduct(
      userId,
      dto.product_id,
    );

    if (existing) {
      throw new ConflictException('Product already in wishlist');
    }

    const item = await this.wishlistRepository.create(userId, dto.product_id);

    return this.formatWishlistItem(item);
  }

  async removeFromWishlist(userId, id) {
    const item = await this.wishlistRepository.findByIdAndUserId(id, userId);

    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }

    await this.wishlistRepository.delete(id);

    return { message: 'Removed from wishlist successfully' };
  }

  formatWishlistItem(item) {
    return {
      id: item.id,
      user_id: item.user_id,
      product_id: item.product_id,
      created_at: item.created_at,
      product: this.formatProduct(item.product),
    };
  }

  formatProduct(product) {
    if (!product) {
      return null;
    }

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
      })),
    };
  }
}
