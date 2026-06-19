-- Onboarding profile fields (run once against wardrobe_db)
ALTER TABLE "user_profiles"
  ADD COLUMN IF NOT EXISTS "name" TEXT,
  ADD COLUMN IF NOT EXISTS "country" TEXT,
  ADD COLUMN IF NOT EXISTS "language" TEXT,
  ADD COLUMN IF NOT EXISTS "preferences" JSONB;
