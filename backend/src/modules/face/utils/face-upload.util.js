import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FaceEmbeddingDto } from '../dto/face-embedding.dto';

export const FACE_UPLOAD_FIELD = 'frontFace';
export const FACE_LIVENESS_FRAMES_FIELD = 'livenessFrames';
export const FACE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const FACE_MIN_LIVENESS_FRAMES = 3;

function readUploadedFile(file) {
  if (!file?.buffer?.length) {
    return null;
  }

  return {
    imageBuffer: file.buffer,
    imageMimeType: file.mimetype || 'image/jpeg',
  };
}

function collectFrameBuffers(files = {}) {
  const primary = files?.[FACE_UPLOAD_FIELD]?.[0];
  const extraFrames = files?.[FACE_LIVENESS_FRAMES_FIELD] || [];
  const buffers = [];

  const primaryFrame = readUploadedFile(primary);
  if (primaryFrame) {
    buffers.push(primaryFrame);
  }

  for (const frame of extraFrames) {
    const parsed = readUploadedFile(frame);
    if (parsed) {
      buffers.push(parsed);
    }
  }

  return buffers;
}

export async function toFaceAuthDto(files = {}, body = {}, options = {}) {
  const {
    requireLiveness = true,
    allowLegacyJson = false,
  } = options;

  const frameBuffers = collectFrameBuffers(files);
  const challengeType = body.challengeType || body.challenge_type || null;
  const captureSessionId = body.captureSessionId || body.capture_session_id || null;

  if (frameBuffers.length > 0) {
    if (requireLiveness) {
      if (!challengeType) {
        throw new BadRequestException('Liveness challenge required.');
      }

      if (frameBuffers.length < FACE_MIN_LIVENESS_FRAMES) {
        throw new BadRequestException(
          `Provide at least ${FACE_MIN_LIVENESS_FRAMES} live camera frames.`,
        );
      }
    }

    const primary = frameBuffers[0];
    return {
      imageBuffer: primary.imageBuffer,
      imageMimeType: primary.imageMimeType,
      livenessFrames: frameBuffers,
      challengeType,
      captureSessionId,
    };
  }

  if (requireLiveness && !allowLegacyJson) {
    throw new BadRequestException('Live camera capture required. Image uploads are not allowed.');
  }

  const legacyFile = files?.[FACE_UPLOAD_FIELD]?.[0] || files?.frontFace?.[0];
  const legacyFrame = readUploadedFile(legacyFile);
  if (legacyFrame) {
    return legacyFrame;
  }

  const dto = plainToInstance(FaceEmbeddingDto, body, {
    enableImplicitConversion: true,
  });

  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    const messages = errors.flatMap((error) =>
      Object.values(error.constraints || {}),
    );
    throw new BadRequestException(messages);
  }

  if (!dto.image) {
    throw new BadRequestException('Provide a frontFace image upload.');
  }

  if (requireLiveness && !allowLegacyJson) {
    throw new BadRequestException('Live camera capture required. Image uploads are not allowed.');
  }

  return dto;
}

export async function toFaceAnalysisDto(files = {}, body = {}) {
  return toFaceAuthDto(files, body, {
    requireLiveness: false,
    allowLegacyJson: true,
  });
}

/** @deprecated Use toFaceAuthDto */
export const toFaceEmbeddingDto = toFaceAuthDto;
