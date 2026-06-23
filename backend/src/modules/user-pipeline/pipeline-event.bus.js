import { Injectable } from '@nestjs/common';

export const PIPELINE_SIGNALS = {
  FACE_ANALYSIS_COMPLETED: 'pipeline.face_analysis.completed',
  BODY_ANALYSIS_COMPLETED: 'pipeline.body_analysis.completed',
  PROFILE_UPDATED: 'pipeline.profile.updated',
};

export @Injectable()
class PipelineEventBus {
  constructor() {
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
  }
}
