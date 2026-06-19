import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './common/logger/winston.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { FashionDnaModule } from './modules/fashion-dna/fashion-dna.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AdminModule } from './modules/admin/admin.module';
import { FaceModule } from './modules/face/face.module';
import { RequestIdMiddleware } from './middleware/request-id.middleware';

export @Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    RecommendationsModule,
    FashionDnaModule,
    WishlistModule,
    OrdersModule,
    AdminModule,
    FaceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
class AppModule {
  configure(consumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
