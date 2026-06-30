-- Admin role & face fields for users table
-- Safe to run multiple times (IF NOT EXISTS)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
  END IF;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role "UserRole" NOT NULL DEFAULT 'USER';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS face_registered BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS admin_face_embedding JSONB;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS admin_created_at TIMESTAMPTZ;

-- Ensure existing rows have default role
UPDATE users SET role = 'USER' WHERE role IS NULL;
