-- AI Stylist chat persistence (optional — Redis is primary; this enables long-term history)
CREATE TABLE IF NOT EXISTS "stylist_chat_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stylist_chat_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "stylist_chat_sessions_user_id_idx"
  ON "stylist_chat_sessions"("user_id");

CREATE TABLE IF NOT EXISTS "stylist_chat_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stylist_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "stylist_chat_messages_session_id_idx"
  ON "stylist_chat_messages"("session_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stylist_chat_messages_session_id_fkey'
  ) THEN
    ALTER TABLE "stylist_chat_messages"
      ADD CONSTRAINT "stylist_chat_messages_session_id_fkey"
      FOREIGN KEY ("session_id") REFERENCES "stylist_chat_sessions"("id") ON DELETE CASCADE;
  END IF;
END $$;
