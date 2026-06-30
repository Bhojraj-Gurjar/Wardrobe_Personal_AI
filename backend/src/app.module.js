import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { StorageModule } from './storage/storage.module';
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
import { UserActivityModule } from './modules/user-activity/user-activity.module';
import { AdminModule } from './modules/admin/admin.module';
import { FaceModule } from './modules/face/face.module';
import { FaceAnalysisModule } from './modules/face-analysis/face-analysis.module';
import { BodyAnalysisModule } from './modules/body-analysis/body-analysis.module';
import { DigitalAvatarModule } from './modules/digital-avatar/digital-avatar.module';
import { UserPipelineModule } from './modules/user-pipeline/user-pipeline.module';
import { PipelineEventModule } from './modules/user-pipeline/pipeline-event.module';
import { UserArtifactsModule } from './modules/user-artifacts/user-artifacts.module';
import { UserMediaModule } from './modules/user-media/user-media.module';
import { CartModule } from './modules/cart/cart.module';
import { StylistModule } from './modules/stylist/stylist.module';
import { AvatarModule } from './modules/avatar/avatar.module';
import { TryOnModule } from './modules/try-on/try-on.module';
import { VirtualTryOnModule } from './modules/virtual-try-on/virtual-try-on.module';
import { PersonalClosetModule } from './modules/personal-closet/personal-closet.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SupportModule } from './modules/support/support.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AiModule } from './modules/ai/ai.module';
import { RequestIdMiddleware } from './middleware/request-id.middleware';

export @Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    StorageModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    RecommendationsModule,
    FashionDnaModule,
    WishlistModule,
    CartModule,
    OrdersModule,
    UserActivityModule,
    AdminModule,
    AiModule,
    StylistModule,
    FaceModule,
    FaceAnalysisModule,
    BodyAnalysisModule,
    DigitalAvatarModule,
    AvatarModule,
    PipelineEventModule,
    UserPipelineModule,
    UserArtifactsModule,
    UserMediaModule,
    TryOnModule,
    VirtualTryOnModule,
    PersonalClosetModule,
    DashboardModule,
    SupportModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
class AppModule {
  configure(consumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
