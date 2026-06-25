import { Module } from '@nestjs/common';
import { CartModule } from '../cart/cart.module';
import { PersonalClosetController } from './personal-closet.controller';
import { PersonalClosetRepository } from './personal-closet.repository';
import { PersonalClosetService } from './personal-closet.service';

export @Module({
  imports: [CartModule],
  controllers: [PersonalClosetController],
  providers: [PersonalClosetService, PersonalClosetRepository],
  exports: [PersonalClosetService],
})
class PersonalClosetModule {}
