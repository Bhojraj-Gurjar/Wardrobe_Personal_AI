import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FashionDnaModule } from '../fashion-dna/fashion-dna.module';
import { ProductsModule } from '../products/products.module';
import { WishlistController } from './controllers/wishlist.controller';
import { WishlistService } from './services/wishlist.service';
import { WishlistRepository } from './repositories/wishlist.repository';

export @Module({
  imports: [AuthModule, FashionDnaModule, ProductsModule],
  controllers: [WishlistController],
  providers: [WishlistService, WishlistRepository],
  exports: [WishlistService],
})
class WishlistModule {}
