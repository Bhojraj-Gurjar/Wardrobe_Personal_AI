import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantService } from '../../../database/qdrant.service';
import { PrismaService } from '../../../database/prisma.service';

export @Injectable()
class FaceRepository {
  constructor(@Inject(QdrantService) qdrantService, @Inject(ConfigService) configService, @Inject(PrismaService) prismaService) {
    this.qdrantService = qdrantService;
    this.configService = configService;
    this.prisma = prismaService;
    this.collection = configService.get('face.collection');
    this.vectorSize = configService.get('face.vectorSize');
  }

  upsertFaceVector(userId, embedding) {
    return this.qdrantService.upsertVector(
      this.collection,
      userId,
      embedding,
      { user_id: userId },
      this.vectorSize,
    );
  }

  upsertFaceRegistration(userId, faceImageUrl = null) {
    const faceEmbeddingId = userId;
    const data = {
      face_embedding_id: faceEmbeddingId,
      is_face_registered: true,
      registered_at: new Date(),
    };

    if (faceImageUrl) {
      data.face_image_url = faceImageUrl;
    }

    return this.prisma.faceRegistration.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        face_image_url: faceImageUrl,
        ...data,
      },
      update: data,
    });
  }

  findFaceRegistration(userId) {
    return this.prisma.faceRegistration.findUnique({
      where: { user_id: userId },
    });
  }

  searchFaceVector(embedding, limit = 1) {
    return this.qdrantService.searchInCollection(
      this.collection,
      embedding,
      limit,
      this.vectorSize,
    );
  }

  deleteFaceVector(userId) {
    return this.qdrantService.deleteVector(this.collection, userId);
  }

  async purgeStaleFaceVectors() {
    if (!this.qdrantService.isConfigured()) {
      return { deleted: 0 };
    }

    let deleted = 0;
    let offset = undefined;

    do {
      const { points, nextOffset } = await this.qdrantService.scrollCollection(
        this.collection,
        100,
        offset,
      );

      for (const point of points) {
        const userId = point.payload?.user_id || String(point.id);
        const user = await this.findUserById(userId);

        if (!user) {
          await this.qdrantService.deleteVector(this.collection, point.id);
          deleted += 1;
        }
      }

      offset = nextOffset;
    } while (offset);

    return { deleted };
  }

  findUserById(userId) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  getFaceVector(userId) {
    return this.qdrantService.getVector(this.collection, userId);
  }
}
