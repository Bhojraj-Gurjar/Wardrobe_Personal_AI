import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export @Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
class PrismaModule {}
