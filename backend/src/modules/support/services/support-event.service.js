import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { SUPPORT_EVENTS } from '../validators/support.constants';

export @Injectable()
class SupportEventService {
  constructor() {
    this.userStreams = new Map();
    this.adminStream = new Subject();
    this.handlers = new Map();
  }

  on(event, handler) {
    const existing = this.handlers.get(event) || [];
    existing.push(handler);
    this.handlers.set(event, existing);
  }

  emit(event, payload) {
    const handlers = this.handlers.get(event) || [];

    handlers.forEach((handler) => {
      Promise.resolve(handler(payload)).catch(() => null);
    });

    if (payload?.userId && !payload?.isInternal) {
      const stream = this.getUserStream(payload.userId);
      stream.next({ event, data: payload, timestamp: new Date().toISOString() });
    }

    if (
      event === SUPPORT_EVENTS.TICKET_CREATED
      || event === SUPPORT_EVENTS.TICKET_UPDATED
      || event === SUPPORT_EVENTS.MESSAGE_CREATED
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
