import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FashionDnaController } from './controllers/fashion-dna.controller';
import { FashionDnaService } from './services/fashion-dna.service';
import { FashionDnaRepository } from './repositories/fashion-dna.repository';

export @Module({
  imports: [AuthModule],
  controllers: [FashionDnaController],
  providers: [FashionDnaService, FashionDnaRepository],
  exports: [FashionDnaService],
})
class FashionDnaModule {}
