import { Inject, Injectable } from '@nestjs/common';
import { AiService } from './modules/ai/services/ai.service';
import { QdrantService } from './database/qdrant.service';

export @Injectable()
class AppService {
  constructor(@Inject(AiService) aiService, @Inject(QdrantService) qdrantService) {
    this.aiService = aiService;
    this.qdrantService = qdrantService;
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'Wardrobe AI API',
      layer: 'nestjs',
    };
  }

  async getAiHealth() {
    return this.aiService.checkHealth();
  }

  async getQdrantHealth() {
    return this.qdrantService.checkHealth();
  }

  async getDiagnostics() {
    const nestjs = this.getHealth();
    const [fastapi, qdrant] = await Promise.all([
      this.getAiHealth(),
      this.getQdrantHealth(),
    ]);

    const layers = {
      frontend: { status: 'unknown', note: 'Check browser console for [FaceUpload] logs' },
      nestjs,
      fastapi,
      qdrant,
    };

    let failingLayer = null;
    if (fastapi.status !== 'ok') {
      failingLayer = 'nestjs_to_fastapi';
    } else if (qdrant.status !== 'ok') {
      failingLayer = 'nestjs_to_qdrant';
    }

    return {
      status: failingLayer ? 'degraded' : 'ok',
      layers,
      collection: qdrant.face_collection || null,
      environment: {
        AI_SERVICE_URL: fastapi.url,
        QDRANT_URL: qdrant.url,
        QDRANT_FACE_COLLECTION: qdrant.faceCollection,
        FACE_VECTOR_SIZE: qdrant.faceVectorSize,
      },
      failing_layer: failingLayer,
    };
  }
}
