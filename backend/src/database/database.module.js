import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { RedisModule } from './redis.module';
import { QdrantModule } from './qdrant.module';

export @Module({
  imports: [PrismaModule, RedisModule, QdrantModule],
  exports: [PrismaModule, RedisModule, QdrantModule],
})
class DatabaseModule {}
