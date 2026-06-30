-- Personal Closet module (additive)

ALTER TABLE "saved_outfits" ADD COLUMN IF NOT EXISTS "items" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "saved_outfits" ADD COLUMN IF NOT EXISTS "thumbnail" VARCHAR(2048);
ALTER TABLE "saved_outfits" ADD COLUMN IF NOT EXISTS "total_price" DOUBLE PRECISION;
ALTER TABLE "saved_outfits" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "saved_outfits" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "personal_closet" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "size" TEXT,
  "is_removed" BOOLEAN NOT NULL DEFAULT false,
  "purchased_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "personal_closet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "personal_closet_user_id_order_id_product_id_key"
  ON "personal_closet"("user_id", "order_id", "product_id");
CREATE INDEX IF NOT EXISTS "personal_closet_user_id_is_removed_idx"
  ON "personal_closet"("user_id", "is_removed");

DO $$ BEGIN
  ALTER TABLE "personal_closet"
    ADD CONSTRAINT "personal_closet_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "favorite_brands" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "brand_name" TEXT NOT NULL,
  "logo_url" VARCHAR(2048),
  "interaction_count" INTEGER NOT NULL DEFAULT 0,
  "preferred_category" TEXT,
  "is_removed" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "favorite_brands_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "favorite_brands_user_id_brand_name_key"
  ON "favorite_brands"("user_id", "brand_name");

DO $$ BEGIN
  ALTER TABLE "favorite_brands"
    ADD CONSTRAINT "favorite_brands_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "favorite_colors" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "color_name" TEXT NOT NULL,
  "hex_code" TEXT,
  "usage_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "is_removed" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "favorite_colors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "favorite_colors_user_id_color_name_key"
  ON "favorite_colors"("user_id", "color_name");

DO $$ BEGIN
  ALTER TABLE "favorite_colors"
    ADD CONSTRAINT "favorite_colors_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
