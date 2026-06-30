export const FACE_CAPTURE_FAILED_MESSAGE =
  'Hold still for a second while we capture your face.';



export const FACE_QUALITY_TOO_LOW_MESSAGE =

  'Improve lighting and center your face in the circle.';



const LIVENESS_HINTS = [
  ['hold still', 'Hold still for a second while we capture your face.'],
  ['liveness', "Keep your eyes open, face the light, and hold still without blinking."],
  ['live face', 'Use your live camera — photos and screens are not accepted'],
  ['move closer', 'Move closer to the camera'],
  ['center your face', 'Move your face inside the camera frame.'],
  ['multiple faces', 'Only one person should be visible'],
  ['no face detected', 'Move your face inside the camera frame.'],
];



function mapServerMessage(message) {

  const lower = String(message || '').toLowerCase();



  for (const [needle, hint] of LIVENESS_HINTS) {

    if (lower.includes(needle)) {

      return hint;

    }

  }



  return null;

}



export function getFaceErrorMessage(err, fallback = 'Something went wrong', context = 'login') {

  const mapped = mapServerMessage(err?.message);

  if (mapped) {

    return mapped;

  }



  const message = String(err?.message || '');

  const lower = message.toLowerCase();



  if (lower.includes('denied') || lower.includes('permission') || lower.includes('notallowed')) {

    return 'Camera permission denied. Allow camera access in your browser settings.';

  }



  if (err?.status === 409) {

    return message || 'Face already registered.';

  }



  if (err?.status === 429 || lower.includes('too many failed')) {

    return 'Too many failed attempts. Try again later.';

  }



  if (lower.includes('face not recognized') || (err?.status === 401 && context === 'login')) {

    return 'Face not recognized. Try again or sign in with password.';

  }



  if (err?.status === 408 || lower.includes('timed out')) {

    return 'Verification timed out. Hold still and try again.';

  }



  if (err?.status === 503 || lower.includes('ai service unavailable') || lower.includes('face service unavailable')) {

    return 'Face service is temporarily unavailable.';

  }



  if (err?.status === 401 && context === 'verify') {

    return 'Face not recognized.';

  }



  if (message && message !== 'Request failed') {

    return message;

  }



  return fallback;

}

