import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

export @Injectable()
class QdrantService {
  constructor(@Inject(ConfigService) configService) {
    this.configService = configService;
    this.logger = new Logger(QdrantService.name);
    this.collection = configService.get('qdrant.collection');
    this.vectorSize = configService.get('qdrant.vectorSize');
    this.client = this.createClient();
  }

  createClient() {
    const url = this.configService.get('qdrant.url');

    if (!url) {
      return null;
    }

    return new QdrantClient({
      url,
      apiKey: this.configService.get('qdrant.apiKey') || undefined,
      checkCompatibility: false,
    });
  }

  isConfigured() {
    return Boolean(this.client);
  }

  async ensureCollection(collectionName, vectorSize) {
    if (!this.client) {
      return false;
    }

    const collections = await this.client.getCollections();
    const exists = collections.collections.some(
      (item) => item.name === collectionName,
    );

    if (!exists) {
      await this.client.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
      });
    }

    return true;
  }

  async ensureDefaultCollection() {
    return this.ensureCollection(this.collection, this.vectorSize);
  }

  async searchSimilar(vector, limit = 10) {
    return this.searchInCollection(
      this.collection,
      vector,
      limit,
      this.vectorSize,
    );
  }

  async searchInCollection(collectionName, vector, limit, vectorSize) {
    if (!this.client) {
      return [];
    }

    await this.ensureCollection(collectionName, vectorSize);

    const results = await this.client.search(collectionName, {
      vector,
      limit,
      with_payload: true,
    });

    return results.map((point) => ({
      id: String(point.id),
      score: point.score,
      payload: point.payload || {},
    }));
  }

  async upsertProductVector(productId, vector, payload = {}) {
    return this.upsertVector(
      this.collection,
      productId,
      vector,
      {
        product_id: productId,
        ...payload,
      },
      this.vectorSize,
    );
  }

  async upsertVector(collectionName, pointId, vector, payload, vectorSize) {
    if (!this.client) {
      return false;
    }

    await this.ensureCollection(collectionName, vectorSize);

    await this.client.upsert(collectionName, {
      wait: true,
      points: [
        {
          id: pointId,
          vector,
          payload,
        },
      ],
    });

    return true;
  }

  async deleteVector(collectionName, pointId) {
    if (!this.client) {
      return false;
    }

    await this.client.delete(collectionName, {
      wait: true,
      points: [pointId],
    });

    return true;
  }
}
