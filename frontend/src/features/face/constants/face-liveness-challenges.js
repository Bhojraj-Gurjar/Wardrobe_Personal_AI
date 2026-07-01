/** Registration / general liveness — hold still. */
export const FACE_LIVENESS_CHALLENGE = {
  id: 'hold_still',
  label: 'Hold still',
  instruction: 'Hold still for a second while we capture your face.',
  durationMs: 1200,
};

/** Face login — single blink, fast capture window. */
export const FACE_LOGIN_LIVENESS_CHALLENGE = {
  id: 'blink_once',
  label: 'Blink once',
  instruction: 'Look at the camera and blink once.',
  durationMs: 1500,
};



/** @deprecated Use FACE_LIVENESS_CHALLENGE */

export const FACE_LIVENESS_CHALLENGES = [FACE_LIVENESS_CHALLENGE];



export const FACE_LIVENESS_PHASE = {

  POSITIONING: 'positioning',

  CHALLENGE: 'challenge',

  CAPTURING: 'capturing',

  COMPLETE: 'complete',

};



export const FACE_LIVENESS_MIN_FRAMES = 3;

export const FACE_LIVENESS_MAX_FRAMES = 5;

export const FACE_LIVENESS_CAPTURE_INTERVAL_MS = 180;

export const FACE_LIVENESS_DETECTION_INTERVAL_MS = 83;

export const FACE_LIVENESS_POSITION_STABLE_MS = 1000;

export const FACE_LIVENESS_STABLE_FRAME_COUNT = 3;

export const FACE_LIVENESS_INSTRUCTION_PAUSE_MS = 200;

export const FACE_LOGIN_MAX_CLIENT_FAILURES = 5;

export const FACE_LOGIN_CLIENT_LOCK_MS = 15 * 60 * 1000;



export const FACE_CAPTURE_TIMEOUT_MESSAGE =

  "We couldn't capture a clear face. Please ensure good lighting and look directly at the camera.";



export function pickRandomLivenessChallenge() {

  return FACE_LIVENESS_CHALLENGE;

}



export function getLivenessChallengeById(id) {

  if (!id) {

    return FACE_LIVENESS_CHALLENGE;

  }

  if (id === 'blink_once' || id === 'blink_twice') {

    return FACE_LOGIN_LIVENESS_CHALLENGE;

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

    LIVENESS_FAILED: "We couldn't verify your face clearly. Please try again.",

  };



  return messages[issue] || 'Look directly at the camera.';

}


