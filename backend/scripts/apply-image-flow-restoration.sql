-- Isolated try-on history + image flow restoration (additive)

CREATE TABLE IF NOT EXISTS "virtual_tryons" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "input_image" VARCHAR(2048),
  "transparent_image" VARCHAR(2048),
  "generated_image" VARCHAR(2048),
  "selected_products" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "virtual_tryons_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "virtual_tryons_user_id_created_at_idx"
  ON "virtual_tryons"("user_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "virtual_tryons"
    ADD CONSTRAINT "virtual_tryons_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
