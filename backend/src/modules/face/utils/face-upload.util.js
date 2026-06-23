import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FaceEmbeddingDto } from '../dto/face-embedding.dto';

export const FACE_UPLOAD_FIELD = 'frontFace';
export const FACE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export async function toFaceAuthDto(file, body = {}) {
  if (file?.buffer?.length) {
    return {
      imageBuffer: file.buffer,
      imageMimeType: file.mimetype || 'image/jpeg',
    };
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

  return dto;
}

/** @deprecated Use toFaceAuthDto */
export const toFaceEmbeddingDto = toFaceAuthDto;
