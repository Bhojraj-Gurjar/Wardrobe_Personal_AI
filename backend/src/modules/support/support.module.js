import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupportController } from './controllers/support.controller';
import { AdminSupportController } from './controllers/admin-support.controller';
import { SupportService } from './services/support.service';
import { SupportEventService } from './services/support-event.service';
import { SupportRepository } from './repositories/support.repository';

export @Module({
  imports: [AuthModule],
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService, SupportEventService, SupportRepository],
  exports: [SupportService, SupportRepository, SupportEventService],
})
class SupportModule {}
