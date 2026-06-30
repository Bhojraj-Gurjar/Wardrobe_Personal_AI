import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { formatCatalogProduct } from '../../products/utils/product-catalog.mapper';
import { STYLIST_INTENTS } from '../constants/stylist-intents.constants';
import { formatStylistPrice } from '../utils/stylist-price.util';

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';

export @Injectable()
class StylistLlmService {
  constructor(@Inject(ConfigService) configService) {
    this.configService = configService;
    this.logger = new Logger(StylistLlmService.name);
    this.apiKey = configService.get('openai.apiKey');
  }

  isAvailable() {
    return Boolean(this.apiKey);
  }

  async generateResponse({
    message,
    promptContext,
    products,
    intent,
    history = [],
  }) {
    if (!this.isAvailable()) {
      return null;
    }

    const systemPrompt = this.buildSystemPrompt(promptContext, products, intent);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map((entry) => ({
        role: entry.role === 'assistant' ? 'assistant' : 'user',
        content: entry.content,
      })),
      { role: 'user', content: message },
    ];

    try {
      const response = await fetch(OPENAI_CHAT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          temperature: 0.7,
          response_format: { type: 'json_object' },
          messages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`OpenAI stylist chat failed: ${response.status} ${errorText}`);
        return null;
      }

      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (!content) {
        return null;
      }

      const parsed = JSON.parse(content);
      const matchedProducts = this.matchProducts(parsed.product_ids, products);

      return {
        message: parsed.message || parsed.response || '',
        products: matchedProducts.map((product) => formatCatalogProduct(product)),
        sections: {
          outfit_recommendations: parsed.outfit_recommendations || [],
          accessories: parsed.accessories || [],
          color_suggestions: parsed.color_suggestions || [],
          budget_tips: parsed.budget_tips || [],
        },
        intent,
        source: 'openai',
      };
    } catch (error) {
      this.logger.warn(`OpenAI stylist error: ${error.message}`);
      return null;
    }
  }

  buildSystemPrompt(promptContext, products, intent) {
    const catalog = products
      .slice(0, 8)
      .map(
        (product) =>
          `- id:${product.id} | ${product.name} | ${product.brand || 'Brand'} | ${formatStylistPrice(product.price, product.currency)} | ${product.category || ''}`,
      )
      .join('\n');

    const intentRules = {
      [STYLIST_INTENTS.GREETING]: 'Respond with a friendly greeting only. product_ids must be empty.',
      [STYLIST_INTENTS.COLOR_ADVICE]: 'Focus on colors only. Do not recommend products unless asked.',
      [STYLIST_INTENTS.BODY_STYLE_GUIDANCE]: 'Give body-fit advice only. No product list unless relevant.',
      [STYLIST_INTENTS.FACE_STYLE_GUIDANCE]: 'Give face-shape and color advice only.',
    };

    const intentRule = intentRules[intent?.type]
      || 'Recommend only from the provided catalog when suggesting products.';

    return `You are Wardrobe AI Stylist — an expert fashion advisor.

User profile:
${JSON.stringify(promptContext, null, 2)}

Detected intent: ${intent?.type || 'GENERAL'}
${JSON.stringify(intent, null, 2)}

Intent rule: ${intentRule}

Available catalog products (ONLY recommend from this list):
${catalog || 'No products — give advice without inventing items.'}

Respond in JSON:
{
  "message": "Markdown response tailored to the user's exact question",
  "product_ids": ["uuid-from-catalog-only"],
  "outfit_recommendations": [{"title":"Top","description":"..."}],
  "accessories": ["item1"],
  "color_suggestions": ["color1"],
  "budget_tips": ["tip1"]
}

Rules:
- Answer the SPECIFIC user question — never give the same generic outfit block every time
- Reference body type, skin tone, face shape when available
- Never invent product names or prices
- For greetings: warm intro only, empty product_ids
- For color questions: colors and reasoning, minimal products
- Keep message under 220 words`;
  }

  matchProducts(productIds, products) {
    if (!Array.isArray(productIds) || !productIds.length) {
      return products.slice(0, 4);
    }

    const map = Object.fromEntries(products.map((product) => [product.id, product]));
    return productIds.map((id) => map[id]).filter(Boolean);
  }
}
