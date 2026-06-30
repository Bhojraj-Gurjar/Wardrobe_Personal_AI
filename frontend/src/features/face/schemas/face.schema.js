import { z } from 'zod';
import { FACE_VECTOR_SIZE } from '@/features/face/constants/face-steps';

/** Matches backend FaceEmbeddingDto — single embedding array, not image fields. */
export const faceEmbeddingSchema = z.object({
  embedding: z
    .array(z.number())
    .length(
      FACE_VECTOR_SIZE,
      `Embedding must contain exactly ${FACE_VECTOR_SIZE} values`,
    ),
});
