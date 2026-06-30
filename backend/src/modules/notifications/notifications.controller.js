import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AdminRoleGuard } from '../../guards/admin-role.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { NotificationEventService } from './notification-event.service';

export @ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
class NotificationsController {
  constructor(
    @Inject(NotificationsService) notificationsService,
    @Inject(NotificationEventService) notificationEventService,
  ) {
    this.notificationsService = notificationsService;
    this.notificationEventService = notificationEventService;
  }

  @Get()
  @ApiOperation({ summary: 'List unified notifications' })
  list(@CurrentUser() user, @Query() query) {
    return this.notificationsService.list(user.userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  unreadCount(@CurrentUser() user) {
    return this.notificationsService.getUnreadCount(user.userId).then((count) => ({
      unreadCount: count,
    }));
  }

  @Patch('read')
  @ApiOperation({ summary: 'Mark notifications as read' })
  markRead(@CurrentUser() user, @Body('ids') ids) {
    return this.notificationsService.markRead(user.userId, ids);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user) {
    return this.notificationsService.markAllRead(user.userId);
  }

  @Sse('events')
  @ApiOperation({ summary: 'Subscribe to unified notification events (SSE)' })
  streamEvents(@CurrentUser() user) {
    return this.notificationEventService.getUserStream(user.userId).pipe(
      map((event) => ({ data: event })),
    );
  }
}

export @ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminRoleGuard)
@Controller('admin/notifications')
class AdminNotificationsController {
  constructor(
    @Inject(NotificationsService) notificationsService,
    @Inject(NotificationEventService) notificationEventService,
  ) {
    this.notificationsService = notificationsService;
    this.notificationEventService = notificationEventService;
  }

  @Get()
  @ApiOperation({ summary: 'List admin unified notifications' })
  list(@CurrentUser() user, @Query() query) {
    return this.notificationsService.list(user.userId, query);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user) {
    return this.notificationsService.getUnreadCount(user.userId).then((count) => ({
      unreadCount: count,
    }));
  }

  @Patch('read')
  markRead(@CurrentUser() user, @Body('ids') ids) {
    return this.notificationsService.markRead(user.userId, ids);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user) {
    return this.notificationsService.markAllRead(user.userId);
  }

  @Sse('events')
  @ApiOperation({ summary: 'Subscribe to admin notification events (SSE)' })
  streamEvents(@CurrentUser() user) {
    return this.notificationEventService.getUserStream(user.userId).pipe(
      map((event) => ({ data: event })),
    );
  }
}

export { NotificationsController, AdminNotificationsController };
