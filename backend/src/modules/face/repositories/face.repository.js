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

  searchFaceVector(embedding) {
    return this.qdrantService.searchInCollection(
      this.collection,
      embedding,
      1,
      this.vectorSize,
    );
  }

  deleteFaceVector(userId) {
    return this.qdrantService.deleteVector(this.collection, userId);
  }

  findUserById(userId) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
