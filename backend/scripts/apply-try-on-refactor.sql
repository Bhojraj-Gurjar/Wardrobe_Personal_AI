-- Try-On Studio refactor: dedicated results table + optional product try-on fields

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "try_on_image" VARCHAR(2048),
  ADD COLUMN IF NOT EXISTS "is_try_on_compatible" BOOLEAN;

CREATE TABLE IF NOT EXISTS "try_on_results" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "product_id" UUID,
  "body_image" VARCHAR(2048),
  "garment_image" VARCHAR(2048),
  "generated_image" VARCHAR(2048),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "try_on_results_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "try_on_results_user_id_created_at_idx"
  ON "try_on_results"("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "try_on_results_product_id_idx"
  ON "try_on_results"("product_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'try_on_results_user_id_fkey'
  ) THEN
    ALTER TABLE "try_on_results"
      ADD CONSTRAINT "try_on_results_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'try_on_results_product_id_fkey'
  ) THEN
    ALTER TABLE "try_on_results"
      ADD CONSTRAINT "try_on_results_product_id_fkey"
      FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
