import { ForbiddenException } from '@nestjs/common';
import {
  isBodyPhotoPath,
  isFacePhotoPath,
} from '../../storage/utils/storage-path.util';

export const IMAGE_MUTATION_SOURCES = {
  FACE: 'face',
  FACE_ANALYSIS: 'face-analysis',
  BODY: 'body',
  BODY_ANALYSIS: 'body-analysis',
  PROFILE: 'profile',
  TRY_ON: 'try-on',
  VIRTUAL_TRY_ON: 'virtual-try-on',
};

const FACE_PHOTO_SOURCES = new Set([
  IMAGE_MUTATION_SOURCES.FACE,
  IMAGE_MUTATION_SOURCES.FACE_ANALYSIS,
]);

const BODY_PHOTO_SOURCES = new Set([
  IMAGE_MUTATION_SOURCES.BODY,
  IMAGE_MUTATION_SOURCES.BODY_ANALYSIS,
]);

export function assertFacePhotoMutationAllowed(source, action = 'update facePhoto') {
  if (!FACE_PHOTO_SOURCES.has(source)) {
    throw new ForbiddenException(
      `Only Face Registration and Face Analysis may ${action}.`,
    );
  }
}

export function assertBodyPhotoMutationAllowed(source, action = 'update bodyPhoto') {
  if (!BODY_PHOTO_SOURCES.has(source)) {
    throw new ForbiddenException(
      `Only Body Analysis and onboarding body upload may ${action}.`,
    );
  }
}

export function sanitizeBodyPhotoPath(path) {
  if (!path || !isBodyPhotoPath(path)) {
    return null;
  }

  return path;
}

export function sanitizeFacePhotoPath(path) {
  if (!path || !isFacePhotoPath(path)) {
    return null;
  }

  return path;
}
