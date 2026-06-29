import { Module } from '@nestjs/common';
import { CartModule } from '../cart/cart.module';
import { FashionDnaModule } from '../fashion-dna/fashion-dna.module';
import { PersonalClosetController } from './personal-closet.controller';
import { PersonalClosetRepository } from './personal-closet.repository';
import { PersonalClosetService } from './personal-closet.service';

export @Module({
  imports: [CartModule, FashionDnaModule],
  controllers: [PersonalClosetController],
  providers: [PersonalClosetService, PersonalClosetRepository],
  exports: [PersonalClosetService],
})
class PersonalClosetModule {}
