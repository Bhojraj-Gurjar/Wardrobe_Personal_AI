-- Wardrobe AI schema updates for audit fixes
-- Run against your PostgreSQL database when applying backend changes.

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'USER';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_created_at" TIMESTAMP(3);

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_number" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping" DOUBLE PRECISION;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "coupon_code" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

CREATE TABLE IF NOT EXISTS "cart_items" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_user_id_product_id_key"
  ON "cart_items"("user_id", "product_id");
CREATE INDEX IF NOT EXISTS "cart_items_user_id_idx" ON "cart_items"("user_id");
CREATE INDEX IF NOT EXISTS "orders_order_number_idx" ON "orders"("order_number");

DO $$ BEGIN
  ALTER TABLE "cart_items"
    ADD CONSTRAINT "cart_items_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "cart_items"
    ADD CONSTRAINT "cart_items_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

UPDATE "users" SET "role" = 'ADMIN' WHERE "email" = 'admin@wardrobeai.com';
