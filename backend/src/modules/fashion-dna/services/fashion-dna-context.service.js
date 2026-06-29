import { Inject, Injectable } from '@nestjs/common';
import { BodyAnalysisService } from '../../body-analysis/body-analysis.service';
import { BodyProfileInsightsService } from '../../body-analysis/services/body-profile-insights.service';
import { FaceAnalysisService } from '../../face-analysis/face-analysis.service';
import { FashionDnaRepository } from '../repositories/fashion-dna.repository';
import { FashionDnaBehavioralService } from './fashion-dna-behavioral.service';
import { extractOnboardingInputs } from './fashion-dna.generator';

function mapWishlistItems(items) {
  return items.map((item) => ({
    product_id: item.product_id,
    brand_id: item.product?.brand_id || null,
    category_id: item.product?.category_id || null,
    color: item.product?.color || null,
    price: item.product?.price ?? null,
    added_at: item.created_at,
  }));
}

function mapOrders(orders) {
  return orders.map((order) => ({
    id: order.id,
    total_amount: order.total_amount,
    status: order.status,
    created_at: order.created_at,
    product_id: order.product_id || null,
    brand_id: order.product?.brand_id || null,
    color: order.product?.color || null,
  }));
}

function mapProductViews(views) {
  return views.map((view) => ({
    product_id: view.product_id,
    brand_id: view.product?.brand_id || null,
    category_id: view.product?.category_id || null,
    color: view.product?.color || null,
    price: view.product?.price ?? null,
    viewed_at: view.viewed_at,
  }));
}

function mapSearches(searches) {
  return searches.map((entry) => ({
    query: entry.query,
    searched_at: entry.searched_at,
  }));
}

export function hasBehavioralActivity(signals) {
  const volume = signals?.activityVolume || {};

  return (
    Number(volume.wishlist || 0) > 0
    || Number(volume.orders || 0) > 0
    || Number(volume.product_views || 0) > 0
    || Number(volume.searches || 0) > 0
    || Number(volume.cart || 0) > 0
    || Number(volume.closet || 0) > 0
    || Number(volume.try_on || 0) > 0
    || Number(volume.virtual_try_on || 0) > 0
    || Number(volume.saved_looks || 0) > 0
  );
}

export @Injectable()
class FashionDnaContextService {
  constructor(
    @Inject(FashionDnaRepository) fashionDnaRepository,
    @Inject(FaceAnalysisService) faceAnalysisService,
    @Inject(BodyAnalysisService) bodyAnalysisService,
    @Inject(BodyProfileInsightsService) bodyProfileInsightsService,
    @Inject(FashionDnaBehavioralService) behavioralService,
  ) {
    this.fashionDnaRepository = fashionDnaRepository;
    this.faceAnalysisService = faceAnalysisService;
    this.bodyAnalysisService = bodyAnalysisService;
    this.bodyProfileInsightsService = bodyProfileInsightsService;
    this.behavioralService = behavioralService;
  }

  async collectContext(userId) {
    const profile = await this.fashionDnaRepository.findUserProfile(userId);
    const preferences = profile?.preferences || {};

    const [faceTraits, visualFaceTraits, storedBodyTraits, signals] = await Promise.all([
      this.faceAnalysisService.collectBiometricTraits(userId),
      this.faceAnalysisService.getStoredTraits(userId),
      this.bodyAnalysisService.getStoredTraits(userId),
      this.behavioralService.collectSignals(userId, preferences),
    ]);

    const profileInsights = this.bodyProfileInsightsService.analyze(profile);
    const bodyTraits = storedBodyTraits
      ? { ...profileInsights, ...storedBodyTraits, analysis_source: 'body_analysis_record' }
      : profileInsights;
    const onboarding = extractOnboardingInputs(profile);

    return {
      profile,
      faceTraits: {
        ...faceTraits,
        ...(visualFaceTraits || {}),
        ...(profile?.skin_tone && !visualFaceTraits?.skin_tone
          ? { skin_tone: profile.skin_tone }
          : {}),
      },
      bodyTraits,
      preferences,
      onboarding,
      signals,
      history: this.behavioralService.buildHistoryPayload(signals),
    };
  }

  buildAnalyzePayload(context) {
    const { faceTraits, bodyTraits, preferences, signals, history } = context;

    return {
      face_traits: faceTraits,
      body_traits: bodyTraits,
      preferences: {
        ...preferences,
        onboarding_profile: {
          gender: context.onboarding.gender,
          age: context.onboarding.age,
          height: context.onboarding.height,
          weight: context.onboarding.weight,
          country: context.onboarding.country,
          language: context.onboarding.language,
        },
      },
      history: {
        ...history,
        wishlist: mapWishlistItems(signals.wishlistItems),
        orders: mapOrders(signals.orders),
        product_views: mapProductViews(signals.productViews),
        searches: mapSearches(signals.searchHistory),
      },
    };
  }
}
