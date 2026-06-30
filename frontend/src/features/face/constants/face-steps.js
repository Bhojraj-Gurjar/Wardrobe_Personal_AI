export const FACE_VECTOR_SIZE =
  Number(process.env.NEXT_PUBLIC_FACE_VECTOR_SIZE) || 128;

export const FRONT_FACE_CAPTURE_KEY = 'frontFace';

export const FACE_REGISTER_STEP = {
  INSTRUCTIONS: 'instructions',
  CAPTURE: 'capture',
};

export const FACE_REGISTER_INSTRUCTIONS = [
  'Look directly at the camera',
  'Ensure good lighting',
  'Remove sunglasses or obstructions',
];

export const FACE_VERIFYING_MESSAGE = 'Verifying your identity...';
