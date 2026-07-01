/** Registration — multi-pose live enrollment. */
export const FACE_REGISTRATION_LIVENESS_CHALLENGE = {
  id: 'enrollment_live',
  label: 'Live enrollment',
  instruction: 'Slowly move your head: center, left, right, up, then down.',
  durationMs: 3500,
};

/** Legacy hold-still (photo dialog / compatibility). */
export const FACE_LIVENESS_CHALLENGE = {
  id: 'hold_still',
  label: 'Hold still',
  instruction: 'Hold still for a second while we capture your face.',
  durationMs: 1200,
};

/** Random login challenges — one is picked per attempt. */
export const FACE_LOGIN_LIVENESS_CHALLENGES = [
  {
    id: 'blink_once',
    label: 'Blink once',
    instruction: 'Look at the camera and blink once.',
    durationMs: 2000,
  },
  {
    id: 'blink_twice',
    label: 'Blink twice',
    instruction: 'Blink twice naturally.',
    durationMs: 2500,
  },
  {
    id: 'turn_left',
    label: 'Turn left',
    instruction: 'Slowly turn your head to the left.',
    durationMs: 2200,
  },
  {
    id: 'turn_right',
    label: 'Turn right',
    instruction: 'Slowly turn your head to the right.',
    durationMs: 2200,
  },
  {
    id: 'look_up',
    label: 'Look up',
    instruction: 'Tilt your head up slightly.',
    durationMs: 2000,
  },
  {
    id: 'smile',
    label: 'Smile',
    instruction: 'Give a natural smile.',
    durationMs: 2000,
  },
  {
    id: 'nod',
    label: 'Nod',
    instruction: 'Nod your head once.',
    durationMs: 2200,
  },
];

/** @deprecated Use FACE_LOGIN_LIVENESS_CHALLENGES */
export const FACE_LOGIN_LIVENESS_CHALLENGE = FACE_LOGIN_LIVENESS_CHALLENGES[0];

/** @deprecated Use FACE_LIVENESS_CHALLENGE */
export const FACE_LIVENESS_CHALLENGES = [FACE_LIVENESS_CHALLENGE];

export const FACE_LIVENESS_PHASE = {
  POSITIONING: 'positioning',
  CHALLENGE: 'challenge',
  CAPTURING: 'capturing',
  COMPLETE: 'complete',
};

export const FACE_LIVENESS_MIN_FRAMES = 4;
export const FACE_LIVENESS_MAX_FRAMES = 5;
export const FACE_LIVENESS_CAPTURE_INTERVAL_MS = 200;
export const FACE_LIVENESS_DETECTION_INTERVAL_MS = 66;
export const FACE_LIVENESS_POSITION_STABLE_MS = 350;
export const FACE_LIVENESS_STABLE_FRAME_COUNT = 2;
export const FACE_LIVENESS_INSTRUCTION_PAUSE_MS = 650;

export const FACE_LOGIN_MAX_CLIENT_FAILURES = 5;
export const FACE_LOGIN_CLIENT_LOCK_MS = 15 * 60 * 1000;

export const FACE_CAPTURE_TIMEOUT_MESSAGE =
  "We couldn't capture a clear face. Please ensure good lighting and look directly at the camera.";

export const FACE_LIVENESS_FAILED_MESSAGE =
  'Live face not detected. Please complete the verification.';

export function pickRandomLoginLivenessChallenge() {
  const pool = FACE_LOGIN_LIVENESS_CHALLENGES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** @deprecated Use pickRandomLoginLivenessChallenge */
export function pickRandomLivenessChallenge() {
  return pickRandomLoginLivenessChallenge();
}

export function getLivenessChallengeById(id) {
  if (!id) {
    return FACE_LIVENESS_CHALLENGE;
  }

  if (id === 'enrollment_live') {
    return FACE_REGISTRATION_LIVENESS_CHALLENGE;
  }

  const loginMatch = FACE_LOGIN_LIVENESS_CHALLENGES.find((challenge) => challenge.id === id);
  if (loginMatch) {
    return loginMatch;
  }

  if (id === 'hold_still') {
    return FACE_LIVENESS_CHALLENGE;
  }

  return FACE_LIVENESS_CHALLENGES.find((challenge) => challenge.id === id) || FACE_LIVENESS_CHALLENGE;
}

export function getLivenessGuidanceMessage(issue) {
  const messages = {
    FACE_NOT_DETECTED: 'Move your face inside the camera frame.',
    MULTIPLE_FACES: 'Multiple faces detected — only one person allowed.',
    FACE_TOO_FAR: 'Move closer to the camera.',
    FACE_TOO_CLOSE: 'Move back slightly.',
    POOR_LIGHTING: 'Improve lighting — face a light source.',
    LIVENESS_FAILED: FACE_LIVENESS_FAILED_MESSAGE,
  };

  return messages[issue] || 'Look directly at the camera.';
}
