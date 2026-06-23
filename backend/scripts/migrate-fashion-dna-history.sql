CREATE TABLE IF NOT EXISTS "fashion_dna_history" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "fashion_dna_id" TEXT NOT NULL,
  "change_reason" TEXT NOT NULL,
  "change_source" TEXT,
  "style_type" TEXT NOT NULL,
  "color_affinity" JSONB NOT NULL,
  "budget_range" TEXT NOT NULL,
  "brand_affinity" JSONB NOT NULL,
  "fashion_confidence_score" DOUBLE PRECISION NOT NULL,
  "face_traits" JSONB NOT NULL,
  "body_traits" JSONB NOT NULL,
  "preference_traits" JSONB NOT NULL,
  "activity_traits" JSONB NOT NULL DEFAULT '{}',
  "dna_created_at" TIMESTAMP(3) NOT NULL,
  "dna_updated_at" TIMESTAMP(3) NOT NULL,
  "archived_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fashion_dna_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "fashion_dna_history_user_id_archived_at_idx"
  ON "fashion_dna_history"("user_id", "archived_at");

CREATE INDEX IF NOT EXISTS "fashion_dna_history_fashion_dna_id_idx"
  ON "fashion_dna_history"("fashion_dna_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fashion_dna_history_user_id_fkey'
  ) THEN
    ALTER TABLE "fashion_dna_history"
      ADD CONSTRAINT "fashion_dna_history_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
