-- Virtual Try-On CatVTON refactor (additive columns)

ALTER TABLE "virtual_tryons"
  ADD COLUMN IF NOT EXISTS "product_id" TEXT,
  ADD COLUMN IF NOT EXISTS "body_photo_reference" VARCHAR(2048),
  ADD COLUMN IF NOT EXISTS "garment_image" VARCHAR(2048);
