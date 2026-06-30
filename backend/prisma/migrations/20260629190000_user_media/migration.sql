-- CreateTable
CREATE TABLE "user_media" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "original_file_name" TEXT,
    "stored_file_name" TEXT,
    "storage_path" VARCHAR(2048) NOT NULL,
    "public_url" VARCHAR(2048),
    "thumbnail_url" VARCHAR(2048),
    "file_size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "mime_type" TEXT,
    "upload_source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_media_user_id_module_status_idx" ON "user_media"("user_id", "module", "status");

-- CreateIndex
CREATE INDEX "user_media_user_id_created_at_idx" ON "user_media"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "user_media" ADD CONSTRAINT "user_media_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
