-- Fashion DNA v2 schema migration
-- Run against existing wardrobe_db when upgrading from style_score/lifestyle_score columns.

ALTER TABLE "fashion_dna" ADD COLUMN IF NOT EXISTS "style_type" TEXT;
ALTER TABLE "fashion_dna" ADD COLUMN IF NOT EXISTS "budget_range" TEXT;
ALTER TABLE "fashion_dna" ADD COLUMN IF NOT EXISTS "fashion_confidence_score" DOUBLE PRECISION;
ALTER TABLE "fashion_dna" ADD COLUMN IF NOT EXISTS "face_traits" JSONB;
ALTER TABLE "fashion_dna" ADD COLUMN IF NOT EXISTS "body_traits" JSONB;
ALTER TABLE "fashion_dna" ADD COLUMN IF NOT EXISTS "preference_traits" JSONB;

UPDATE "fashion_dna"
SET
  "style_type" = COALESCE("style_type", 'versatile'),
  "budget_range" = COALESCE("budget_range", 'MID_RANGE'),
  "fashion_confidence_score" = COALESCE(
    "fashion_confidence_score",
    COALESCE("style_score", 50)
  ),
  "face_traits" = COALESCE(
    "face_traits",
    '{"is_face_registered":false,"registered_at":null,"biometric_enabled":false}'::jsonb
  ),
  "body_traits" = COALESCE("body_traits", '{}'::jsonb),
  "preference_traits" = COALESCE("preference_traits", '{}'::jsonb)
WHERE "style_type" IS NULL
   OR "budget_range" IS NULL
   OR "fashion_confidence_score" IS NULL
   OR "face_traits" IS NULL
   OR "body_traits" IS NULL
   OR "preference_traits" IS NULL;

ALTER TABLE "fashion_dna" ALTER COLUMN "style_type" SET NOT NULL;
ALTER TABLE "fashion_dna" ALTER COLUMN "budget_range" SET NOT NULL;
ALTER TABLE "fashion_dna" ALTER COLUMN "fashion_confidence_score" SET NOT NULL;
ALTER TABLE "fashion_dna" ALTER COLUMN "face_traits" SET NOT NULL;
ALTER TABLE "fashion_dna" ALTER COLUMN "body_traits" SET NOT NULL;
ALTER TABLE "fashion_dna" ALTER COLUMN "preference_traits" SET NOT NULL;

ALTER TABLE "fashion_dna" DROP COLUMN IF EXISTS "style_score";
ALTER TABLE "fashion_dna" DROP COLUMN IF EXISTS "lifestyle_score";
