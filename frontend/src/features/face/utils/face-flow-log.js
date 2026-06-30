const FACE_FLOW_PREFIX = '[FaceFlow]';
const isDev = process.env.NODE_ENV === 'development';

export function logFaceStep(step, detail = '') {
  if (!isDev) return;

  const timestamp = new Date().toISOString().split('T')[1]?.replace('Z', '');
  const message = detail
    ? `${FACE_FLOW_PREFIX} [${timestamp}] ${step}: ${detail}`
    : `${FACE_FLOW_PREFIX} [${timestamp}] ${step}`;
  console.log(message);
}

export function logFaceStepError(step, error) {
  if (!isDev) return;

  const detail = error?.message || String(error);
  console.warn(`${FACE_FLOW_PREFIX} ${step} FAILED: ${detail}`);
}

export const FaceFlowLog = {
  cameraReady: () => logFaceStep('Camera initialized'),
  faceDetected: (count = 1) => logFaceStep('Face detected', `count=${count}`),
  stableFrameDetected: (frames = 1) => logFaceStep('Stable frame detected', `frames=${frames}`),
  qualityPassed: () => logFaceStep('Quality check passed'),
  livenessPassed: (challenge) => logFaceStep('Liveness passed', challenge || 'hold_still'),
  embeddingGenerated: () => logFaceStep('Embedding created'),
  embeddingSaved: () => logFaceStep('Embedding saved'),
  matchingScore: (score) => logFaceStep('Face matched', score != null ? `score=${score}` : ''),
  loginSuccess: () => logFaceStep('Login completed'),
  registrationSuccess: () => logFaceStep('Registration completed'),
  rejectReason: (reason) => logFaceStepError('Reject reason', { message: reason }),
};
