-- Migrate monetary data from legacy USD to INR (display + storage).
-- Numeric amounts stored under USD are scaled by the historical conversion factor.

ALTER TABLE "products" ALTER COLUMN "currency" SET DEFAULT 'INR';

UPDATE "product_variants" pv
SET "price_override" = ROUND(pv."price_override" * 83)
FROM "products" p
WHERE pv."product_id" = p."id"
  AND p."currency" = 'USD'
  AND pv."price_override" IS NOT NULL;

UPDATE "products"
SET
  "price" = ROUND("price" * 83),
  "mrp" = CASE WHEN "mrp" IS NOT NULL THEN ROUND("mrp" * 83) ELSE NULL END,
  "currency" = 'INR'
WHERE "currency" = 'USD';

UPDATE "products"
SET "currency" = 'INR'
WHERE "currency" IS NULL OR "currency" = '';

UPDATE "orders"
SET
  "total_amount" = ROUND("total_amount" * 83),
  "subtotal" = CASE WHEN "subtotal" IS NOT NULL THEN ROUND("subtotal" * 83) ELSE NULL END,
  "discount" = CASE WHEN "discount" IS NOT NULL AND "discount" > 0 THEN ROUND("discount" * 83) ELSE "discount" END,
  "tax" = CASE WHEN "tax" IS NOT NULL AND "tax" > 0 THEN ROUND("tax" * 83) ELSE "tax" END
WHERE "total_amount" < 5000;

UPDATE "saved_outfits"
SET "total_price" = ROUND("total_price" * 83)
WHERE "total_price" IS NOT NULL AND "total_price" < 5000;
