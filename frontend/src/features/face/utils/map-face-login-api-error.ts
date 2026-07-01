import { FaceLoginError } from '@/features/face/types/face-login.types';



type ApiLikeError = {

  status?: number;

  message?: string;

};



function includesAny(message: string, terms: string[]) {

  return terms.some((term) => message.includes(term));

}



/** Maps API / network errors into typed face-login failures. */

export function mapFaceLoginApiError(err: unknown): FaceLoginError {

  const error = err as ApiLikeError;

  const message = String(error?.message || '').toLowerCase();

  const status = error?.status;



  if (!status || status === 0) {

    return FaceLoginError.NETWORK_ERROR;

  }



  if (status === 408 || includesAny(message, ['timed out', 'timeout'])) {

    return FaceLoginError.TIMEOUT;

  }



  if (status >= 500) {
    return FaceLoginError.BACKEND_ERROR;
  }

  if (includesAny(message, ['blink once', 'blink twice', 'hold still', "couldn't verify your face", 'liveness', 'verify your face clearly', 'live face not detected', 'complete the verification'])) {
    return FaceLoginError.LIVENESS_FAILED;
  }

  if (includesAny(message, ['ai service unavailable', 'service unavailable', 'temporarily unavailable'])) {
    return FaceLoginError.BACKEND_ERROR;
  }



  if (includesAny(message, ['no face detected'])) {

    return FaceLoginError.FACE_NOT_DETECTED;

  }



  if (includesAny(message, ['multiple faces'])) {

    return FaceLoginError.MULTIPLE_FACES;

  }



  if (includesAny(message, ['move closer', 'face_too_small', 'too small'])) {

    return FaceLoginError.FACE_TOO_FAR;

  }



  if (includesAny(message, ['move back', 'face_too_large', 'too large'])) {

    return FaceLoginError.FACE_TOO_CLOSE;

  }



  if (includesAny(message, ['center your face', 'off center', 'off_center'])) {

    return FaceLoginError.FACE_NOT_DETECTED;

  }



  if (status === 429 || includesAny(message, ['too many failed'])) {

    return FaceLoginError.RATE_LIMITED;

  }



  if (includesAny(message, ['live face', 'spoof'])) {

    return FaceLoginError.LIVENESS_FAILED;

  }



  if (includesAny(message, ['too dark', 'lighting', 'blur', 'bright'])) {

    return FaceLoginError.POOR_LIGHTING;

  }



  if (

    status === 401

    || includesAny(message, ['face not recognized', 'no matching face', 'invalid credentials'])

  ) {

    return FaceLoginError.FACE_NOT_RECOGNIZED;

  }



  return FaceLoginError.UNKNOWN;

}

