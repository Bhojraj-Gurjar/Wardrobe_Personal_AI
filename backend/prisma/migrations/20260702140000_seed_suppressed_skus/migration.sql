-- CreateTable
CREATE TABLE "seed_suppressed_skus" (
    "sku" VARCHAR(128) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seed_suppressed_skus_pkey" PRIMARY KEY ("sku")
);
