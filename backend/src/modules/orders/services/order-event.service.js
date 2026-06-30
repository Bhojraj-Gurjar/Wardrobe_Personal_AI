import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { ORDER_EVENTS } from '../validators/order.constants';

export @Injectable()
class OrderEventService {
  constructor() {
    this.userStreams = new Map();
    this.adminStream = new Subject();
  }

  emit(event, payload) {
    if (payload?.userId) {
      const stream = this.getUserStream(payload.userId);
      stream.next({ event, data: payload, timestamp: new Date().toISOString() });
    }

    if (
      event === ORDER_EVENTS.ORDER_CREATED
      || event === ORDER_EVENTS.ORDER_STATUS_UPDATED
      || event === ORDER_EVENTS.ORDER_CANCELLED
      || event === ORDER_EVENTS.ORDER_NOTIFICATION_CREATED
    ) {
      this.adminStream.next({ event, data: payload, timestamp: new Date().toISOString() });
    }
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
