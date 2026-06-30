import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FashionDnaModule } from '../fashion-dna/fashion-dna.module';
import { PersonalClosetModule } from '../personal-closet/personal-closet.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { DashboardController } from './dashboard.controller';
import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';

export @Module({
  imports: [
    AuthModule,
    PersonalClosetModule,
    FashionDnaModule,
    RecommendationsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository],
  exports: [DashboardService],
})
class DashboardModule {}
