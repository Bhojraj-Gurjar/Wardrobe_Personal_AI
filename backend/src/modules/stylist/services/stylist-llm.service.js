import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { formatCatalogProduct } from '../../products/utils/product-catalog.mapper';

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
          `- id:${product.id} | ${product.name} | ${product.brand || 'Brand'} | ₹${product.price} | ${product.category || ''}`,
      )
      .join('\n');

    return `You are Wardrobe AI Stylist — an expert fashion advisor for Indian users. Prices are in INR (₹).

User profile:
${JSON.stringify(promptContext, null, 2)}

Parsed intent:
${JSON.stringify(intent, null, 2)}

Available catalog products (only recommend from this list):
${catalog || 'No products loaded — give general advice.'}

Respond in JSON with this exact shape:
{
  "message": "Friendly markdown response with outfit advice",
  "product_ids": ["uuid-from-catalog"],
  "outfit_recommendations": [{"title":"...", "description":"..."}],
  "accessories": ["item1", "item2"],
  "color_suggestions": ["color1", "color2"],
  "budget_tips": ["tip1", "tip2"]
}

Rules:
- Be warm, specific, and actionable
- Reference user's body type, skin tone, and style when available
- For budget queries, respect max budget in INR
- For interview/wedding/casual queries, tailor formality appropriately
- Keep message under 200 words`;
  }

  matchProducts(productIds, products) {
    if (!Array.isArray(productIds) || !productIds.length) {
      return products.slice(0, 4);
    }

    const map = Object.fromEntries(products.map((product) => [product.id, product]));
    return productIds.map((id) => map[id]).filter(Boolean);
  }
}
