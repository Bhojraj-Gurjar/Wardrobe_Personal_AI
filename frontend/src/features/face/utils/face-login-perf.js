const isDev = process.env.NODE_ENV === 'development';
const PREFIX = '[FaceLoginPerf]';

const marks = new Map();

export const FaceLoginPerf = {
  mark(label) {
    if (!isDev || typeof performance === 'undefined') {
      return;
    }
    marks.set(label, performance.now());
  },

  measure(label, startLabel) {
    if (!isDev || typeof performance === 'undefined') {
      return null;
    }

    const start = marks.get(startLabel);
    if (start == null) {
      return null;
    }

    const elapsedMs = Math.round(performance.now() - start);
    console.info(`${PREFIX} ${label}: ${elapsedMs}ms`);
    return elapsedMs;
  },

  report() {
    if (!isDev) {
      return;
    }

    const phases = [
      ['camera_startup', 'flow_start', 'camera_ready'],
      ['face_detection', 'camera_ready', 'liveness_complete'],
      ['liveness_capture', 'liveness_start', 'liveness_complete'],
      ['api_round_trip', 'api_start', 'api_complete'],
      ['total_login', 'flow_start', 'login_complete'],
    ];

    for (const [label, start, end] of phases) {
      const startAt = marks.get(start);
      const endAt = marks.get(end);
      if (startAt != null && endAt != null) {
        console.info(`${PREFIX} ${label}: ${Math.round(endAt - startAt)}ms`);
      }
    }
  },

  reset() {
    marks.clear();
  },
};
