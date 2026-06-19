import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WishlistController } from './controllers/wishlist.controller';
import { WishlistService } from './services/wishlist.service';
import { WishlistRepository } from './repositories/wishlist.repository';

export @Module({
  imports: [AuthModule],
  controllers: [WishlistController],
  providers: [WishlistService, WishlistRepository],
  exports: [WishlistService],
})
class WishlistModule {}
