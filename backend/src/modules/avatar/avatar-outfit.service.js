import { Inject, Injectable } from '@nestjs/common';
import { AvatarRepository } from './avatar.repository';
import { formatAvatarOutfitRecord } from './utils/avatar.mapper';
import { formatCatalogProduct } from '../products/utils/product-catalog.mapper';

export @Injectable()
class AvatarOutfitService {
  constructor(@Inject(AvatarRepository) avatarRepository) {
    this.avatarRepository = avatarRepository;
  }

  collectOutfitProductIds(outfit) {
    return [
      outfit?.selected_tshirt_id,
      outfit?.selected_shirt_id,
      outfit?.selected_jacket_id,
      outfit?.selected_pant_id,
      outfit?.selected_shoes_id,
    ].filter(Boolean);
  }

  async calculateTotalPrice(productIds = []) {
    const products = await this.avatarRepository.findProductsByIds(productIds);

    return products.reduce((sum, product) => sum + (Number(product.price) || 0), 0);
  }

  async loadOutfit(avatarId) {
    const outfit = await this.avatarRepository.findOutfitByAvatarId(avatarId);

    if (!outfit) {
      return null;
    }

    const productIds = this.collectOutfitProductIds(outfit);
    const products = await this.avatarRepository.findProductsByIds(productIds);
    const productMap = {};

    products.forEach((product) => {
      productMap[product.id] = formatCatalogProduct(product);
    });

    return formatAvatarOutfitRecord(outfit, productMap);
  }

  async saveOutfit(avatarId, payload = {}) {
    const current = await this.avatarRepository.findOutfitByAvatarId(avatarId);
    const isFullSnapshot = [
      'selectedTshirtId',
      'selectedShirtId',
      'selectedJacketId',
      'selectedPantId',
      'selectedShoesId',
    ].every((field) => field in payload);

    const merged = isFullSnapshot
      ? {
        selected_tshirt_id: payload.selectedTshirtId ?? null,
        selected_shirt_id: payload.selectedShirtId ?? null,
        selected_jacket_id: payload.selectedJacketId ?? null,
        selected_pant_id: payload.selectedPantId ?? null,
        selected_shoes_id: payload.selectedShoesId ?? null,
      }
      : {
        selected_tshirt_id:
          payload.selectedTshirtId !== undefined
            ? payload.selectedTshirtId
            : current?.selected_tshirt_id ?? null,
        selected_shirt_id:
          payload.selectedShirtId !== undefined
            ? payload.selectedShirtId
            : current?.selected_shirt_id ?? null,
        selected_jacket_id:
          payload.selectedJacketId !== undefined
            ? payload.selectedJacketId
            : current?.selected_jacket_id ?? null,
        selected_pant_id:
          payload.selectedPantId !== undefined
            ? payload.selectedPantId
            : current?.selected_pant_id ?? null,
        selected_shoes_id:
          payload.selectedShoesId !== undefined
            ? payload.selectedShoesId
            : current?.selected_shoes_id ?? null,
      };

    const productIds = this.collectOutfitProductIds(merged);
    const totalPrice = await this.calculateTotalPrice(productIds);

    await this.avatarRepository.upsertOutfit(avatarId, {
      ...merged,
      total_price: totalPrice,
    });

    return this.loadOutfit(avatarId);
  }
}
