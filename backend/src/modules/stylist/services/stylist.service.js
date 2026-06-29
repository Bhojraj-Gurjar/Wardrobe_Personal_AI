import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EXAMPLE_QUERIES } from '../constants/stylist.constants';
import {
  STYLIST_INTENTS,
  THINKING_STEPS_BY_INTENT,
} from '../constants/stylist-intents.constants';
import { REFRESH_SOURCES } from '../../fashion-dna/constants/fashion-dna-regeneration.constants';
import { FashionDnaRegenerationService } from '../../fashion-dna/services/fashion-dna-regeneration.service';
import { StylistRepository } from '../repositories/stylist.repository';
import { StylistContextService } from './stylist-context.service';
import { StylistEngineService } from './stylist-engine.service';
import { StylistLlmService } from './stylist-llm.service';
import { parseStylistIntent } from './stylist-intent.service';
import { buildSuggestedQuestions } from '../utils/stylist-suggestions.util';

const SKIP_LLM_INTENTS = new Set([
  STYLIST_INTENTS.GREETING,
  STYLIST_INTENTS.COLOR_ADVICE,
  STYLIST_INTENTS.BODY_STYLE_GUIDANCE,
  STYLIST_INTENTS.FACE_STYLE_GUIDANCE,
  STYLIST_INTENTS.CLOSET_ADVICE,
  STYLIST_INTENTS.ACCESSORY_ADVICE,
]);

export @Injectable()
class StylistService {
  constructor(
    @Inject(StylistRepository) stylistRepository,
    @Inject(StylistContextService) stylistContextService,
    @Inject(StylistEngineService) stylistEngineService,
    @Inject(StylistLlmService) stylistLlmService,
    @Inject(FashionDnaRegenerationService) fashionDnaRegenerationService,
  ) {
    this.stylistRepository = stylistRepository;
    this.stylistContextService = stylistContextService;
    this.stylistEngineService = stylistEngineService;
    this.stylistLlmService = stylistLlmService;
    this.fashionDnaRegenerationService = fashionDnaRegenerationService;
  }

  getSuggestions() {
    return {
      examples: EXAMPLE_QUERIES,
      capabilities: [
        'Outfit Recommendations',
        'Color Analysis',
        'Occasion Styling',
        'Body & Face Advice',
        'Budget Styling',
      ],
      llm_enabled: this.stylistLlmService.isAvailable(),
    };
  }

  listSessions(userId) {
    return this.stylistRepository.listSessions(userId);
  }

  async getSession(userId, sessionId) {
    const session = await this.stylistRepository.getSession(userId, sessionId);

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    return this.formatSession(session);
  }

  createSession(userId, title) {
    return this.stylistRepository.createSession(userId, title || 'New styling chat');
  }

  async deleteSession(userId, sessionId) {
    const deleted = await this.stylistRepository.deleteSession(userId, sessionId);

    if (!deleted) {
      throw new NotFoundException('Chat session not found');
    }

    return { message: 'Session deleted' };
  }

  resolveThinkingSteps(intent) {
    return THINKING_STEPS_BY_INTENT[intent?.type]
      || THINKING_STEPS_BY_INTENT.DEFAULT;
  }

  async chat(userId, dto) {
    let session;

    if (dto.session_id) {
      session = await this.stylistRepository.getSession(userId, dto.session_id);
      if (!session) {
        throw new NotFoundException('Chat session not found');
      }
    } else {
      session = await this.stylistRepository.createSession(userId);
    }

    const userMessage = {
      id: randomUUID(),
      role: 'user',
      content: dto.message.trim(),
      metadata: {},
      created_at: new Date().toISOString(),
    };

    session = await this.stylistRepository.appendMessage(session, userMessage);

    const context = await this.stylistContextService.buildUserContext(userId);
    const intent = parseStylistIntent(dto.message, session.messages);
    const thinkingSteps = this.resolveThinkingSteps(intent);
    const promptContext = this.stylistContextService.buildPromptContext(context);

    const engineDraft = await this.stylistEngineService.generateResponse(
      userId,
      intent,
      context,
      session.messages,
    );

    let response = engineDraft;

    if (
      this.stylistLlmService.isAvailable()
      && !SKIP_LLM_INTENTS.has(intent.type)
      && engineDraft.products?.length
    ) {
      const llmResponse = await this.stylistLlmService.generateResponse({
        message: dto.message,
        promptContext,
        products: engineDraft.products.map((product) => ({
          ...product,
          id: product.id,
        })),
        intent,
        history: session.messages,
      });

      if (llmResponse?.message) {
        response = {
          ...llmResponse,
          products: llmResponse.products?.length
            ? llmResponse.products
            : engineDraft.products,
          intent,
        };
      }
    }

    const suggestedQuestions = buildSuggestedQuestions(intent, context);

    const assistantMessage = {
      id: randomUUID(),
      role: 'assistant',
      content: response.message,
      metadata: {
        products: response.products,
        sections: response.sections,
        intent: response.intent,
        source: response.source,
        thinking_steps: thinkingSteps,
        suggested_questions: suggestedQuestions,
      },
      created_at: new Date().toISOString(),
    };

    session = await this.stylistRepository.appendMessage(session, assistantMessage);

    this.fashionDnaRegenerationService.trigger(userId, REFRESH_SOURCES.STYLIST);

    return {
      session: this.formatSession(session),
      reply: {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantMessage.content,
        products: response.products,
        sections: response.sections,
        source: response.source,
        intent: response.intent,
        thinking_steps: thinkingSteps,
        suggested_questions: suggestedQuestions,
        created_at: assistantMessage.created_at,
      },
    };
  }

  formatSession(session) {
    return {
      id: session.id,
      title: session.title,
      created_at: session.created_at,
      updated_at: session.updated_at,
      messages: (session.messages || []).map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        products: message.metadata?.products || [],
        sections: message.metadata?.sections || null,
        source: message.metadata?.source || null,
        intent: message.metadata?.intent || null,
        thinking_steps: message.metadata?.thinking_steps || [],
        suggested_questions: message.metadata?.suggested_questions || [],
        created_at: message.created_at,
      })),
    };
  }
}
