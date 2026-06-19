import { Inject, BadRequestException,
  Injectable,
  NotFoundException, } from '@nestjs/common';
import { FashionDnaRepository } from '../repositories/fashion-dna.repository';
import { buildFashionDnaPayload } from './fashion-dna.generator';

export @Injectable()
class FashionDnaService {
  constructor(@Inject(FashionDnaRepository) fashionDnaRepository) {
    this.fashionDnaRepository = fashionDnaRepository;
  }

  async getFashionDna(userId) {
    const fashionDna = await this.fashionDnaRepository.findByUserId(userId);

    if (!fashionDna) {
      throw new NotFoundException(
        'Fashion DNA not found. Generate it first using POST /fashion-dna/generate',
      );
    }

    return this.formatFashionDna(fashionDna);
  }

  async generateFashionDna(userId) {
    const profile = await this.fashionDnaRepository.findUserProfile(userId);

    if (!profile) {
      throw new BadRequestException(
        'Complete your profile before generating Fashion DNA',
      );
    }

    const wishlistItems =
      await this.fashionDnaRepository.findWishlistProducts(userId);

    const payload = buildFashionDnaPayload(profile, wishlistItems);
    const fashionDna = await this.fashionDnaRepository.upsert(userId, payload);

    return this.formatFashionDna(fashionDna);
  }

  formatFashionDna(fashionDna) {
    return {
      id: fashionDna.id,
      user_id: fashionDna.user_id,
      style_score: fashionDna.style_score,
      color_affinity: fashionDna.color_affinity,
      brand_affinity: fashionDna.brand_affinity,
      lifestyle_score: fashionDna.lifestyle_score,
      created_at: fashionDna.created_at,
      updated_at: fashionDna.updated_at,
    };
  }
}
