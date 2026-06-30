import { z } from 'zod';

const affinitySchema = z.record(z.coerce.number().min(0).max(1));

export const updateFashionDnaSchema = z
  .object({
    style_type: z.string().min(1).max(80).optional(),
    color_affinity: affinitySchema.optional(),
    budget_range: z
      .enum(['ECONOMY', 'MID_RANGE', 'PREMIUM', 'LUXURY'])
      .optional(),
    brand_affinity: affinitySchema.optional(),
    fashion_confidence_score: z.coerce.number().min(0).max(100).optional(),
    face_traits: z.record(z.unknown()).optional(),
    body_traits: z.record(z.unknown()).optional(),
    preference_traits: z.record(z.unknown()).optional(),
  })
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    { message: 'Provide at least one field to update' },
  );
