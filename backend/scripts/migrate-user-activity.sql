-- User activity tracking + Fashion DNA activity_traits

CREATE TABLE IF NOT EXISTS "product_views" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_views_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "search_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "searched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "search_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "product_views_user_id_viewed_at_idx"
  ON "product_views"("user_id", "viewed_at");
CREATE INDEX IF NOT EXISTS "product_views_product_id_idx"
  ON "product_views"("product_id");
CREATE INDEX IF NOT EXISTS "search_history_user_id_searched_at_idx"
  ON "search_history"("user_id", "searched_at");

ALTER TABLE "product_views"
  DROP CONSTRAINT IF EXISTS "product_views_user_id_fkey";
ALTER TABLE "product_views"
  ADD CONSTRAINT "product_views_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_views"
  DROP CONSTRAINT IF EXISTS "product_views_product_id_fkey";
ALTER TABLE "product_views"
  ADD CONSTRAINT "product_views_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "search_history"
  DROP CONSTRAINT IF EXISTS "search_history_user_id_fkey";
ALTER TABLE "search_history"
  ADD CONSTRAINT "search_history_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fashion_dna"
  ADD COLUMN IF NOT EXISTS "activity_traits" JSONB NOT NULL DEFAULT '{}'::jsonb;
