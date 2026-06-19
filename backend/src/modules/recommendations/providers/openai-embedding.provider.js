import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class OpenAiEmbeddingProvider {
  constructor(@Inject(ConfigService) configService) {
    this.apiKey = configService.get('openai.apiKey');
    this.model = 'text-embedding-3-small';
  }

  isAvailable() {
    // Enable once OpenAI embedding calls are implemented.
    return false;
  }

  async embedUserContext(_contextText) {
    // Future AI integration: call OpenAI embeddings API with user preference text.
    throw new Error(
      'OpenAI embedding provider is reserved for future AI integration',
    );
  }

  async embedProduct(_product) {
    throw new Error(
      'OpenAI embedding provider is reserved for future AI integration',
    );
  }
}
