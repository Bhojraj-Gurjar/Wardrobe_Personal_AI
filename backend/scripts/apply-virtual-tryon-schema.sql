-- Virtual Try-On schema (additive, non-destructive)

ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "body_image" VARCHAR(2048);

CREATE TABLE IF NOT EXISTS "virtual_try_on" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "body_image" VARCHAR(2048),
  "transparent_image" VARCHAR(2048),
  "selected_products" JSONB NOT NULL DEFAULT '[]',
  "generated_outfit_image" VARCHAR(2048),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "virtual_try_on_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "virtual_try_on_user_id_key"
  ON "virtual_try_on"("user_id");

DO $$ BEGIN
  ALTER TABLE "virtual_try_on"
    ADD CONSTRAINT "virtual_try_on_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "saved_outfits" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "name" TEXT,
  "products" JSONB NOT NULL DEFAULT '[]',
  "preview_image" VARCHAR(2048),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_outfits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "saved_outfits_user_id_created_at_idx"
  ON "saved_outfits"("user_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "saved_outfits"
    ADD CONSTRAINT "saved_outfits_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
