import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HeuristicEmbeddingProvider } from './heuristic-embedding.provider';
import { OpenAiEmbeddingProvider } from './openai-embedding.provider';

export @Injectable()
class EmbeddingProviderFactory {
  constructor(@Inject(ConfigService) configService) {
    this.configService = configService;
    this.openAiProvider = new OpenAiEmbeddingProvider(configService);
    this.heuristicProvider = new HeuristicEmbeddingProvider(configService);
  }

  getProvider() {
    if (this.openAiProvider.isAvailable()) {
      return this.openAiProvider;
    }

    return this.heuristicProvider;
  }

  getHeuristicProvider() {
    return this.heuristicProvider;
  }
}
