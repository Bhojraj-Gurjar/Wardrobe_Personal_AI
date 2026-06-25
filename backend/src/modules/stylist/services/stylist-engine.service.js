import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RecommendationsRepository } from '../../recommendations/repositories/recommendations.repository';
import { SmartRecommendationService } from '../../recommendations/services/smart-recommendation.service';
import {
  OCCASION_CATEGORIES,
  STYLIST_MAX_PRODUCTS,
} from '../constants/stylist.constants';
import {
  parseStylistIntent,
  resolveAccessorySuggestions,
  resolveColorSuggestions,
} from './stylist-intent.service';
import { formatCatalogProduct } from '../../products/utils/product-catalog.mapper';

export @Injectable()
class StylistEngineService {
  constructor(
    @Inject(RecommendationsRepository) recommendationsRepository,
    @Inject(SmartRecommendationService) smartRecommendationService,
    @Inject(ConfigService) configService,
  ) {
    this.recommendationsRepository = recommendationsRepository;
    this.smartRecommendationService = smartRecommendationService;
    this.logger = new Logger(StylistEngineService.name);
    this.currency = 'INR';
  }

  async generateResponse(userId, intent, context, history = []) {
    const products = await this.findRelevantProducts(userId, intent, context);
    const colors = resolveColorSuggestions(intent, context);
    const accessories = resolveAccessorySuggestions(intent);
    const budgetTips = this.buildBudgetTips(intent, products, context);
    const outfitNotes = this.buildOutfitNotes(intent, context, products);

    const message = this.composeMessage({
      intent,
      context,
      products,
      colors,
      accessories,
      budgetTips,
      outfitNotes,
    });

    return {
      message,
      products: products.map((product) => formatCatalogProduct(product)),
      sections: {
        outfit_recommendations: outfitNotes,
        accessories,
        color_suggestions: colors,
        budget_tips: budgetTips,
      },
      intent,
      source: 'engine',
    };
  }

  async findRelevantProducts(userId, intent, context) {
    let candidates = [];

    if (intent.occasion) {
      try {
        const eventType = this.mapOccasionToEvent(intent.occasion);
        const recs = await this.smartRecommendationService.getEventRecommendations(
          userId,
          { event: eventType, limit: STYLIST_MAX_PRODUCTS * 2 },
        );
        candidates = (recs?.items || recs?.recommendations || [])
          .map((item) => item.product || item)
          .filter(Boolean);
      } catch (error) {
        this.logger.warn(`Event recommendations fallback: ${error.message}`);
      }
    }

    if (candidates.length < STYLIST_MAX_PRODUCTS) {
      const dbProducts = await this.searchCatalog(intent, context);
      candidates = [...candidates, ...dbProducts];
    }

    const deduped = [];
    const seen = new Set();

    for (const product of candidates) {
      const id = product.id;
      if (!id || seen.has(id)) continue;
      seen.add(id);

      if (intent.maxBudget && Number(product.price) > intent.maxBudget) {
        continue;
      }

      deduped.push(product);
      if (deduped.length >= STYLIST_MAX_PRODUCTS) break;
    }

    return deduped;
  }

  async searchCatalog(intent, context) {
    const keywords = intent.occasion
      ? OCCASION_CATEGORIES[intent.occasion] || []
      : [];
    const searchTerm = keywords[0] || context.signals?.favoriteCategories?.[0] || '';
    const maxPrice = intent.maxBudget || context.budgetProfile?.max || undefined;

    const products = await this.recommendationsRepository.findCandidateProducts([], 40);

    return products
      .filter((product) => {
        if (maxPrice && Number(product.price) > maxPrice) {
          return false;
        }

        if (!searchTerm) {
          return true;
        }

        const haystack = `${product.name} ${product.category} ${product.subcategory} ${product.description || ''}`.toLowerCase();
        return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))
          || haystack.includes(searchTerm.toLowerCase());
      })
      .sort((left, right) => this.scoreProduct(left, context) - this.scoreProduct(right, context))
      .reverse()
      .slice(0, STYLIST_MAX_PRODUCTS * 2);
  }

  scoreProduct(product, context) {
    let score = 0;
    const brand = `${product.brand || ''}`.toLowerCase();
    const color = `${product.color || ''}`.toLowerCase();

    for (const favorite of context.signals?.favoriteBrands || []) {
      if (brand.includes(`${favorite}`.toLowerCase())) score += 3;
    }

    for (const favorite of context.signals?.favoriteColors || []) {
      if (color.includes(`${favorite}`.toLowerCase())) score += 2;
    }

    if (context.budgetProfile?.target) {
      const diff = Math.abs(Number(product.price) - context.budgetProfile.target);
      score += Math.max(0, 5 - diff / 500);
    }

    return score;
  }

  mapOccasionToEvent(occasion) {
    const map = {
      interview: 'formal',
      wedding: 'formal',
      party: 'party',
      casual: 'casual',
      gym: 'sport',
      formal: 'formal',
    };
    return map[occasion] || 'casual';
  }

  buildOutfitNotes(intent, context, products) {
    const occasionLabel = intent.occasion
      ? intent.occasion.charAt(0).toUpperCase() + intent.occasion.slice(1)
      : 'Everyday';

    const bodyType = context.factors?.body_type;
    const fitTip = bodyType
      ? `Choose structured fits that complement your ${bodyType} frame.`
      : 'Prioritize clean lines and balanced proportions.';

    const productList = products.slice(0, 4).map((product) => ({
      title: product.name,
      description: `${product.brand || 'Brand'} · ${product.category || 'Fashion'} · ₹${Math.round(Number(product.price) || 0).toLocaleString('en-IN')}`,
      product_id: product.id,
    }));

    return [
      {
        title: `${occasionLabel} outfit direction`,
        description: fitTip,
        products: productList,
      },
    ];
  }

  buildBudgetTips(intent, products, context) {
    if (!intent.maxBudget && !intent.wantsBudgetTips) {
      return [];
    }

    const maxBudget = intent.maxBudget || context.budgetProfile?.max;
    if (!maxBudget) {
      return ['Shop your wishlist first — items you saved are usually strong style matches.'];
    }

    const total = products.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const tips = [
      `Target a full look under ₹${Math.round(maxBudget).toLocaleString('en-IN')}.`,
    ];

    if (products.length && total <= maxBudget) {
      tips.push(
        `Selected picks total ~₹${Math.round(total).toLocaleString('en-IN')} — within your budget.`,
      );
    } else if (products.length) {
      tips.push(
        'Mix one statement piece with simpler basics to stay on budget.',
      );
    }

    tips.push('Allocate ~60% to core apparel and ~40% to shoes/accessories.');
    return tips;
  }

  composeMessage({ intent, context, products, colors, accessories, budgetTips, outfitNotes }) {
    const name = context.displayName || 'there';
    const occasion = intent.occasion
      ? intent.occasion.replace(/^\w/, (c) => c.toUpperCase())
      : null;

    const intro = occasion
      ? `Hi ${name}! For your ${occasion.toLowerCase()} occasion, here is a personalized plan based on your Fashion DNA.`
      : `Hi ${name}! Here are personalized styling suggestions based on your profile.`;

    const outfitLines = products.length
      ? products
        .slice(0, 4)
        .map(
          (product, index) =>
            `${index + 1}. **${product.name}** (${product.brand || 'Brand'}) — ₹${Math.round(Number(product.price) || 0).toLocaleString('en-IN')}`,
        )
        .join('\n')
      : 'Browse our catalog — complete your profile for sharper product matches.';

    const colorLine = colors.length
      ? `**Colors that flatter you:** ${colors.join(', ')}.`
      : '';

    const accessoryLine = accessories.length
      ? `**Accessories:** ${accessories.join(', ')}.`
      : '';

    const budgetLine = budgetTips.length
      ? `**Budget guidance:** ${budgetTips.join(' ')}`
      : '';

    const styleNote = context.styleType
      ? `Your style profile leans **${context.styleType}** — these picks align with that aesthetic.`
      : '';

    return [intro, styleNote, '**Outfit picks:**', outfitLines, colorLine, accessoryLine, budgetLine]
      .filter(Boolean)
      .join('\n\n');
  }
}
