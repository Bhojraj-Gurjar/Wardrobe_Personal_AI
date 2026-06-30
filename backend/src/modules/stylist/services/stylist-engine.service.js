import { Inject, Injectable, Logger } from '@nestjs/common';
import { RecommendationsRepository } from '../../recommendations/repositories/recommendations.repository';
import { SmartRecommendationService } from '../../recommendations/services/smart-recommendation.service';
import { computeBodyScore } from '../../recommendations/utils/body-score.util';
import {
  OCCASION_CATEGORIES,
  STYLIST_MAX_PRODUCTS,
} from '../constants/stylist.constants';
import { STYLIST_INTENTS } from '../constants/stylist-intents.constants';
import {
  parseStylistIntent,
  resolveAccessorySuggestions,
  resolveColorSuggestions,
} from './stylist-intent.service';
import { formatCatalogProduct } from '../../products/utils/product-catalog.mapper';
import {
  formatStylistPrice,
  priceWithinBudget,
  sumProductPrices,
} from '../utils/stylist-price.util';

const CATEGORY_FILTERS = {
  shirts: ['shirt', 'men-shirts'],
  tshirts: ['t-shirt', 'men-t-shirts', 'tee'],
  shoes: ['shoe', 'sneaker', 'footwear', 'boot', 'loafer'],
  jackets: ['jacket', 'blazer', 'coat'],
  pants: ['jean', 'trouser', 'pant', 'chino'],
};

export @Injectable()
class StylistEngineService {
  constructor(
    @Inject(RecommendationsRepository) recommendationsRepository,
    @Inject(SmartRecommendationService) smartRecommendationService,
  ) {
    this.recommendationsRepository = recommendationsRepository;
    this.smartRecommendationService = smartRecommendationService;
    this.logger = new Logger(StylistEngineService.name);
  }

  async generateResponse(userId, intent, context, history = []) {
    switch (intent.type) {
      case STYLIST_INTENTS.GREETING:
        return this.handleGreeting(intent, context);
      case STYLIST_INTENTS.COLOR_ADVICE:
        return this.handleColorAdvice(intent, context);
      case STYLIST_INTENTS.BODY_STYLE_GUIDANCE:
        return this.handleBodyGuidance(intent, context);
      case STYLIST_INTENTS.FACE_STYLE_GUIDANCE:
        return this.handleFaceGuidance(intent, context);
      case STYLIST_INTENTS.FOOTWEAR_RECOMMENDATION:
        return this.handleFootwear(userId, intent, context);
      case STYLIST_INTENTS.CATEGORY_REQUEST:
        return this.handleCategoryRequest(userId, intent, context);
      case STYLIST_INTENTS.ACCESSORY_ADVICE:
        return this.handleAccessoryAdvice(intent, context);
      case STYLIST_INTENTS.CLOSET_ADVICE:
        return this.handleClosetAdvice(intent, context);
      case STYLIST_INTENTS.SEASONAL_STYLING:
        return this.handleSeasonal(userId, intent, context);
      case STYLIST_INTENTS.FOLLOW_UP_MODIFY:
        return this.handleFollowUp(userId, intent, context);
      case STYLIST_INTENTS.BUDGET_STYLING:
        return this.handleBudgetOutfit(userId, intent, context);
      case STYLIST_INTENTS.OCCASION_STYLING:
        return this.handleOccasionOutfit(userId, intent, context);
      case STYLIST_INTENTS.OUTFIT_GENERATION:
        return this.handleOutfitGeneration(userId, intent, context);
      default:
        return this.handleGeneralAdvice(userId, intent, context);
    }
  }

  handleGreeting(intent, context) {
    const name = context.displayName || 'there';
    return {
      message: `Hi ${name} 👋

I'm your AI Stylist.

I can help with:

• Outfit recommendations
• Color matching
• Occasion styling
• Shopping suggestions
• Personal closet management
• Body-fit advice

What would you like help with today?`,
      products: [],
      sections: {},
      intent,
      source: 'engine',
    };
  }

  handleColorAdvice(intent, context) {
    const name = context.displayName || 'there';
    const colors = resolveColorSuggestions(intent, context);
    const skinTone = context.factors?.skin_tone || 'your skin tone';
    const faceShape = context.factors?.face_shape;
    const dnaColors = context.signals?.favoriteColors?.slice(0, 3) || [];

    const reasons = [];
    if (skinTone && skinTone !== 'your skin tone') {
      reasons.push(`your analyzed **${skinTone}** skin tone`);
    }
    if (faceShape) {
      reasons.push(`your **${faceShape}** face shape`);
    }
    if (dnaColors.length) {
      reasons.push(`your Fashion DNA color affinities (${dnaColors.join(', ')})`);
    }

    const reasonText = reasons.length
      ? `Based on ${reasons.join(', ')}, these colors will flatter you most:`
      : 'Based on your style profile, these colors will work well near your face:';

    const avoid = [];
    if (/deep|dark|wheatish|tan/i.test(`${skinTone}`)) {
      avoid.push('Washed-out pastels with low contrast');
    } else if (/fair|light|cool/i.test(`${skinTone}`)) {
      avoid.push('Harsh neon tones that overpower fair skin');
    } else {
      avoid.push('Muddy tones that flatten your complexion');
    }

    return {
      message: `Hi ${name}! ${reasonText}

**Recommended colors:** ${colors.join(', ')}.

**Use carefully:** ${avoid.join(', ')}.

Want me to build an outfit using these colors?`,
      products: [],
      sections: {
        color_suggestions: colors,
        avoid,
      },
      intent,
      source: 'engine',
    };
  }

  handleBodyGuidance(intent, context) {
    const body = context.bodyAnalysis;
    const name = context.displayName || 'there';

    if (!body?.body_type && !body?.bodyType) {
      return {
        message: `${name}, I don't have a body analysis yet. Complete your onboarding body scan and I'll give precise fit advice for your proportions.`,
        products: [],
        sections: {},
        intent,
        source: 'engine',
      };
    }

    const bodyType = body.body_type || body.bodyType;
    const bodyShape = body.body_shape || body.bodyShape;
    const fitProfile = body.fit_profile || body.fitProfile;
    const topSection = fitProfile?.sections?.find((section) => section.id === 'tops');
    const bottomSection = fitProfile?.sections?.find((section) => section.id === 'bottoms');
    const topRec = topSection?.recommendations?.[0];
    const bottomRec = bottomSection?.recommendations?.[0];

    const topLine = typeof topRec === 'object'
      ? `**${topRec.name}** (${Math.round(topRec.confidence || 0)}% match) — ${topRec.reason}`
      : topSection?.why || 'Choose tops that balance your shoulder-to-waist ratio.';

    const bottomLine = typeof bottomRec === 'object'
      ? `**${bottomRec.name}** (${Math.round(bottomRec.confidence || 0)}% match) — ${bottomRec.reason}`
      : bottomSection?.why || 'Pick bottoms that complement your leg and hip proportions.';

    const chest = body.chest ? `${Math.round(body.chest)} cm chest` : null;
    const waist = body.waist ? `${Math.round(body.waist)} cm waist` : null;
    const metrics = [chest, waist].filter(Boolean).join(', ');

    return {
      message: `Hi ${name}! Here's fit guidance from your **body analysis**:

**Body type:** ${bodyType}${bodyShape ? ` · **Shape:** ${bodyShape}` : ''}${metrics ? ` · ${metrics}` : ''}

**Tops:** ${topLine}

**Bottoms:** ${bottomLine}

Ask me to build a full outfit tailored to your build.`,
      products: [],
      sections: {
        body_guidance: [topLine, bottomLine],
      },
      intent,
      source: 'engine',
    };
  }

  handleFaceGuidance(intent, context) {
    const face = context.faceAnalysis;
    const name = context.displayName || 'there';

    if (!face?.face_shape && !face?.faceShape) {
      return {
        message: `${name}, complete your face analysis scan first — then I can recommend necklines, colors, and frames for your face shape.`,
        products: [],
        sections: {},
        intent,
        source: 'engine',
      };
    }

    const faceShape = face.face_shape || face.faceShape;
    const skinTone = face.skin_tone || face.skinTone || context.factors?.skin_tone;
    const insights = face.raw_ai_response?.styleInsights
      || face.rawAiResponse?.styleInsights;
    const neckSection = insights?.sections?.find((section) => section.id === 'necklines');
    const colorSection = insights?.sections?.find((section) => section.id === 'colors');
    const neckRec = neckSection?.items?.[0]?.recommendation || 'Crew necks and moderate V-necks';
    const colorRec = colorSection?.items?.[0]?.recommendation
      || resolveColorSuggestions(intent, context).slice(0, 4).join(', ');

    return {
      message: `Hi ${name}! Style guidance from your **face analysis**:

**Face shape:** ${faceShape}${skinTone ? ` · **Skin tone:** ${skinTone}` : ''}

**Best necklines:** ${neckRec}
${neckSection?.items?.[0]?.why ? `\n_${neckSection.items[0].why}_` : ''}

**Flattering colors:** ${colorRec}

Want color-only advice or a full outfit built around these traits?`,
      products: [],
      sections: {
        face_guidance: [neckRec, colorRec],
        color_suggestions: resolveColorSuggestions(intent, context),
      },
      intent,
      source: 'engine',
    };
  }

  async handleFootwear(userId, intent, context) {
    const products = await this.findProducts(userId, intent, context, ['shoe', 'sneaker', 'footwear', 'boot']);
    const name = context.displayName || 'there';
    const height = context.bodyAnalysis?.height || context.profile?.height;
    const lines = products.slice(0, 4).map(
      (product, index) =>
        `${index + 1}. **${product.name}** (${product.brand || 'Brand'}) — ${formatStylistPrice(product.price, product.currency)}`,
    );

    const heightTip = height && height >= 185
      ? 'Minimal sneakers and Chelsea boots suit taller proportions.'
      : height && height <= 168
        ? 'Low-profile sneakers with slight elevation balance shorter frames.'
        : 'Choose footwear that matches the formality of your outfit.';

    return {
      message: `Hi ${name}! Footwear picks matched to your profile:

${lines.length ? lines.join('\n') : 'No footwear found in catalog — try browsing the Footwear category.'}

**Fit tip:** ${heightTip}`,
      products: products.map((product) => formatCatalogProduct(product)),
      sections: { footwear: lines },
      intent,
      source: 'engine',
    };
  }

  async handleCategoryRequest(userId, intent, context) {
    const keywords = CATEGORY_FILTERS[intent.category] || [intent.category];
    const products = await this.findProducts(userId, intent, context, keywords);
    const label = intent.category.charAt(0).toUpperCase() + intent.category.slice(1);

    return {
      message: this.composeProductMessage(
        context,
        `${label} recommendations`,
        products,
        `Selected for your ${context.styleType || 'style profile'} and body type.`,
      ),
      products: products.map((product) => formatCatalogProduct(product)),
      sections: { category: [label] },
      intent,
      source: 'engine',
    };
  }

  handleAccessoryAdvice(intent, context) {
    const accessories = resolveAccessorySuggestions(intent);
    const name = context.displayName || 'there';
    const occasion = intent.occasion
      ? intent.occasion.replace(/^\w/, (c) => c.toUpperCase())
      : null;

    return {
      message: `Hi ${name}! ${occasion ? `For **${occasion}**, ` : ''}these accessories complement your profile:

**Suggested accessories:** ${accessories.join(', ')}.

Pair minimal accessories with your skin tone and outfit formality — less is often more.`,
      products: [],
      sections: { accessories },
      intent,
      source: 'engine',
    };
  }

  handleClosetAdvice(intent, context) {
    const closetCount = context.closetItems?.length || 0;
    const wishlistCount = context.signals?.wishlistProductIds?.length || 0;
    const name = context.displayName || 'there';

    if (!closetCount && !wishlistCount) {
      return {
        message: `${name}, your personal closet is empty. Shop or save items to your wishlist and I can help you style what you own.`,
        products: [],
        sections: {},
        intent,
        source: 'engine',
      };
    }

    const closetProducts = (context.closetItems || [])
      .slice(0, 4)
      .map((item) => item.product)
      .filter(Boolean);

    return {
      message: `Hi ${name}! You have **${closetCount} item(s)** in your closet${wishlistCount ? ` and **${wishlistCount}** wishlist saves` : ''}.

Style what you own by mixing your closet staples with one new statement piece. Want an outfit built from your closet?`,
      products: closetProducts.map((product) => formatCatalogProduct(product)),
      sections: { closet_count: [`${closetCount} owned items`] },
      intent,
      source: 'engine',
    };
  }

  async handleSeasonal(userId, intent, context) {
    const seasonKeywords = {
      summer: ['linen', 'cotton', 'lightweight', 't-shirt', 'short'],
      winter: ['jacket', 'layer', 'wool', 'coat', 'sweater'],
      monsoon: ['water', 'jacket', 'quick dry', 'layer'],
    };
    const keywords = seasonKeywords[intent.season] || [];
    const products = await this.findProducts(userId, intent, context, keywords);
    const seasonLabel = intent.season.charAt(0).toUpperCase() + intent.season.slice(1);

    return {
      message: this.composeProductMessage(
        context,
        `${seasonLabel} outfit ideas`,
        products,
        `Curated for ${seasonLabel.toLowerCase()} weather and your style profile.`,
      ),
      products: products.map((product) => formatCatalogProduct(product)),
      sections: { seasonal: [seasonLabel] },
      intent,
      source: 'engine',
    };
  }

  async handleFollowUp(userId, intent, context) {
    let products = intent.previousProducts || [];

    if (intent.modifier === 'cheaper') {
      if (products.length) {
        products = [...products].sort(
          (left, right) => Number(left.price) - Number(right.price),
        );
      } else {
        const budget = intent.previousIntent?.maxBudget
          || context.budgetProfile?.max
          || 5000;
        intent.maxBudget = Math.round(budget * 0.75);
        products = await this.findProducts(userId, intent, context, []);
      }
    } else if (intent.modifier?.color) {
      const color = intent.modifier.color;
      products = await this.findProducts(userId, intent, context, [color]);
    } else if (intent.modifier === 'formal') {
      products = await this.findProducts(userId, { ...intent, occasion: 'formal' }, context, ['suit', 'shirt', 'blazer']);
    } else if (intent.modifier === 'casual') {
      products = await this.findProducts(userId, { ...intent, occasion: 'casual' }, context, ['t-shirt', 'jean', 'sneaker']);
    } else if (!products.length) {
      products = await this.findProducts(userId, intent.previousIntent || intent, context, []);
    }

    return {
      message: this.composeProductMessage(
        context,
        'Updated look based on your request',
        products,
        'I adjusted the previous recommendation using your feedback.',
      ),
      products: products.map((product) => formatCatalogProduct(product)),
      sections: {
        outfit_recommendations: this.buildOutfitSections(products),
      },
      intent,
      source: 'engine',
    };
  }

  async handleBudgetOutfit(userId, intent, context) {
    const products = await this.findProducts(userId, intent, context, []);
    const maxBudget = intent.maxBudget || context.budgetProfile?.max;
    const totalInr = sumProductPrices(products);
    const budgetTips = [];

    if (maxBudget) {
      budgetTips.push(`Target budget: ₹${Math.round(maxBudget).toLocaleString('en-IN')}.`);
      if (products.length) {
        budgetTips.push(
          totalInr <= maxBudget
            ? `Selected picks total ~₹${Math.round(totalInr).toLocaleString('en-IN')} — within budget.`
            : 'Mix one premium piece with affordable basics to stay on budget.',
        );
      }
    }

    return {
      message: this.composeProductMessage(
        context,
        intent.occasion
          ? `${intent.occasion} look under your budget`
          : 'Budget-friendly outfit',
        products,
        context.styleType
          ? `Aligned with your **${context.styleType}** style profile.`
          : 'Filtered from real catalog products.',
      ),
      products: products.map((product) => formatCatalogProduct(product)),
      sections: {
        outfit_recommendations: this.buildOutfitSections(products),
        budget_tips: budgetTips,
      },
      intent,
      source: 'engine',
    };
  }

  async handleOccasionOutfit(userId, intent, context) {
    const products = await this.findProducts(userId, intent, context, []);
    const occasion = intent.occasion.replace(/^\w/, (c) => c.toUpperCase());
    const colors = resolveColorSuggestions(intent, context);
    const accessories = resolveAccessorySuggestions(intent);

    return {
      message: this.composeProductMessage(
        context,
        `${occasion} outfit`,
        products,
        `Tailored for a **${occasion.toLowerCase()}** occasion using your face, body, and Fashion DNA profile.`,
      ),
      products: products.map((product) => formatCatalogProduct(product)),
      sections: {
        outfit_recommendations: this.buildOutfitSections(products),
        color_suggestions: colors,
        accessories,
      },
      intent,
      source: 'engine',
    };
  }

  async handleOutfitGeneration(userId, intent, context) {
    const products = await this.buildCompleteOutfit(userId, intent, context);

    return {
      message: this.composeOutfitBuilderMessage(context, products, intent),
      products: products.map((product) => formatCatalogProduct(product)),
      sections: {
        outfit_recommendations: this.buildOutfitSections(products),
        color_suggestions: resolveColorSuggestions(intent, context),
      },
      intent,
      source: 'engine',
    };
  }

  async handleGeneralAdvice(userId, intent, context) {
    const products = await this.findProducts(userId, intent, context, []);

    return {
      message: this.composeProductMessage(
        context,
        'Styling suggestions',
        products,
        'Here are catalog picks matched to your profile. Ask a specific question for sharper advice.',
      ),
      products: products.map((product) => formatCatalogProduct(product)),
      sections: {},
      intent,
      source: 'engine',
    };
  }

  async buildCompleteOutfit(userId, intent, context) {
    const all = await this.findProducts(userId, intent, context, [], STYLIST_MAX_PRODUCTS * 3);
    const top = all.find((p) => this.matchesKeywords(p, ['shirt', 'tee', 'top', 'polo'])) || all[0];
    const bottom = all.find((p) => this.matchesKeywords(p, ['jean', 'trouser', 'pant', 'chino'])) || all[1];
    const shoes = all.find((p) => this.matchesKeywords(p, ['shoe', 'sneaker', 'boot', 'loafer'])) || all[2];

    return [top, bottom, shoes].filter(Boolean).filter(
      (product, index, array) => product && array.findIndex((item) => item?.id === product.id) === index,
    );
  }

  buildOutfitSections(products) {
    const slots = [
      { label: 'Top', keywords: ['shirt', 'tee', 'top', 'polo'] },
      { label: 'Bottom', keywords: ['jean', 'trouser', 'pant', 'chino'] },
      { label: 'Footwear', keywords: ['shoe', 'sneaker', 'boot', 'loafer'] },
    ];

    return slots.map((slot) => {
      const product = products.find((item) => this.matchesKeywords(item, slot.keywords));
      if (!product) return null;
      return {
        title: slot.label,
        description: `${product.brand || 'Brand'} · ${formatStylistPrice(product.price, product.currency)}`,
        product_id: product.id,
      };
    }).filter(Boolean);
  }

  composeOutfitBuilderMessage(context, products, intent) {
    const name = context.displayName || 'there';
    const sections = this.buildOutfitSections(products);
    const lines = sections.map(
      (section) => `**${section.title}:** ${section.description}`,
    );

    const intro = intent.occasion
      ? `Hi ${name}! Here's a **${intent.occasion}** outfit built from your profile:`
      : `Hi ${name}! Here's a complete look from our catalog:`;

    return [intro, ...lines].join('\n\n');
  }

  composeProductMessage(context, title, products, subtitle) {
    const name = context.displayName || 'there';
    const lines = products.slice(0, 5).map(
      (product, index) =>
        `${index + 1}. **${product.name}** (${product.brand || 'Brand'}) — ${formatStylistPrice(product.price, product.currency)}`,
    );

    return [
      `Hi ${name}! **${title}**`,
      subtitle,
      lines.length ? '**Recommended:**\n' + lines.join('\n') : 'No matching products in catalog yet.',
    ].filter(Boolean).join('\n\n');
  }

  async findProducts(userId, intent, context, extraKeywords = [], limit = STYLIST_MAX_PRODUCTS) {
    let candidates = [];

    if (intent.occasion) {
      try {
        const eventType = this.mapOccasionToEvent(intent.occasion);
        const recs = await this.smartRecommendationService.getEventRecommendations(
          userId,
          { event: eventType, limit: limit * 2 },
        );
        candidates = (recs?.items || recs?.recommendations || [])
          .map((item) => item.product || item)
          .filter(Boolean);
      } catch (error) {
        this.logger.warn(`Event recommendations fallback: ${error.message}`);
      }
    }

    if (candidates.length < limit) {
      const dbProducts = await this.searchCatalog(intent, context, extraKeywords);
      candidates = [...candidates, ...dbProducts];
    }

    return this.dedupeAndFilter(candidates, intent, context, limit);
  }

  async searchCatalog(intent, context, extraKeywords = []) {
    const occasionKeywords = intent.occasion
      ? OCCASION_CATEGORIES[intent.occasion] || []
      : [];
    const keywords = [...occasionKeywords, ...extraKeywords].filter(Boolean);

    const products = await this.recommendationsRepository.findCandidateProducts([], 80);

    return products
      .filter((product) => {
        if (intent.maxBudget && !priceWithinBudget(product, intent.maxBudget)) {
          return false;
        }

        if (!keywords.length) {
          return true;
        }

        const haystack = this.productHaystack(product);
        return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
      })
      .sort((left, right) => this.scoreProduct(left, context) - this.scoreProduct(right, context))
      .reverse();
  }

  dedupeAndFilter(candidates, intent, context, limit) {
    const deduped = [];
    const seen = new Set();

    for (const product of candidates) {
      const id = product.id;
      if (!id || seen.has(id)) continue;
      seen.add(id);

      if (intent.maxBudget && !priceWithinBudget(product, intent.maxBudget)) {
        continue;
      }

      deduped.push(product);
      if (deduped.length >= limit) break;
    }

    return deduped;
  }

  scoreProduct(product, context) {
    let score = 0;
    const bodyAnalysis = {
      bodyType: context.bodyAnalysis?.body_type || context.bodyAnalysis?.bodyType,
      bodyShape: context.bodyAnalysis?.body_shape || context.bodyAnalysis?.bodyShape,
      height: context.bodyAnalysis?.height,
      measurements: context.bodyAnalysis,
    };

    try {
      const bodyScore = computeBodyScore(bodyAnalysis, product, context.profile);
      score += bodyScore.score || 0;
    } catch {
      // ignore scoring errors
    }

    const brand = `${product.brand || ''}`.toLowerCase();
    const color = `${product.color || ''}`.toLowerCase();

    for (const favorite of context.signals?.favoriteBrands || []) {
      if (brand.includes(`${favorite}`.toLowerCase())) score += 3;
    }

    for (const favorite of context.signals?.favoriteColors || []) {
      if (color.includes(`${favorite}`.toLowerCase())) score += 2;
    }

    return score;
  }

  productHaystack(product) {
    return `${product.name} ${product.category} ${product.subcategory} ${product.description || ''} ${product.color || ''}`.toLowerCase();
  }

  matchesKeywords(product, keywords) {
    const haystack = this.productHaystack(product);
    return keywords.some((keyword) => haystack.includes(keyword));
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
}
