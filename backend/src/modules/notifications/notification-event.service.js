import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { NOTIFICATION_EVENTS } from './notifications.constants';

export @Injectable()
class NotificationEventService {
  constructor() {
    this.userStreams = new Map();
    this.adminStream = new Subject();
  }

  emitToUser(userId, payload) {
    if (!userId) {
      return;
    }

    const stream = this.getUserStream(userId);
    stream.next({
      event: NOTIFICATION_EVENTS.CREATED,
      data: payload,
      timestamp: new Date().toISOString(),
    });
  }

  emitToAdmin(payload) {
    this.adminStream.next({
      event: NOTIFICATION_EVENTS.CREATED,
      data: payload,
      timestamp: new Date().toISOString(),
    });
  }

  getUserStream(userId) {
    if (!this.userStreams.has(userId)) {
      this.userStreams.set(userId, new Subject());
    }

    return this.userStreams.get(userId);
  }

  getAdminStream() {
    return this.adminStream;
  }

  removeUserStream(userId) {
    const stream = this.userStreams.get(userId);

    if (stream) {
      stream.complete();
      this.userStreams.delete(userId);
    }
  }
}
