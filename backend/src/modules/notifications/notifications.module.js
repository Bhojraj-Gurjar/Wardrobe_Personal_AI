import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import { NotificationEventService } from './notification-event.service';
import {
  AdminNotificationsController,
  NotificationsController,
} from './notifications.controller';

export @Module({
  imports: [DatabaseModule],
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [
    NotificationsRepository,
    NotificationsService,
    NotificationEventService,
  ],
  exports: [NotificationsService, NotificationEventService],
})
class NotificationsModule {}

export { NotificationsModule };
