export const FACE_AUTH_SUCCESS_KEY = 'wardrobe_face_auth_success';

export function setFaceAuthSuccessMessage(message) {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.setItem(FACE_AUTH_SUCCESS_KEY, message);
}

export function consumeFaceAuthSuccessMessage() {
  if (typeof window === 'undefined') {
    return null;
  }
  const message = sessionStorage.getItem(FACE_AUTH_SUCCESS_KEY);
  if (message) {
    sessionStorage.removeItem(FACE_AUTH_SUCCESS_KEY);
  }
  return message;
}
