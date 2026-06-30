-- OMS: extend order lifecycle, addresses, timeline, documents, notifications

-- New enums
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'WALLET');
CREATE TYPE "AddressType" AS ENUM ('HOME', 'OFFICE', 'OTHER');
CREATE TYPE "OrderPriority" AS ENUM ('NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "OrderDocumentType" AS ENUM ('INVOICE', 'SHIPPING_LABEL');
CREATE TYPE "OrderNotificationType" AS ENUM (
  'ORDER_PLACED',
  'ORDER_ACCEPTED',
  'INVOICE_GENERATED',
  'LABEL_GENERATED',
  'PACKED',
  'READY_TO_DISPATCH',
  'HANDED_OVER',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'RETURNED',
  'REFUND_APPROVED',
  'STATUS_UPDATED'
);

-- Extend OrderStatus enum (PostgreSQL: add new values)
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PACKING';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'READY_TO_DISPATCH';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_HANDOVER';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'RETURNED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'ON_HOLD';

-- Extend orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_number" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tax" DOUBLE PRECISION;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" "PaymentMethod";
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" TEXT DEFAULT 'pending';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_address" JSONB;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_address" JSONB;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "priority" "OrderPriority" NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "estimated_delivery" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tracking_number" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "courier_name" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "package_weight" DOUBLE PRECISION;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "package_id" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "label_generated_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_generated_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "packed_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "dispatched_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivered_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "internal_notes" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "oms_metadata" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "orders_invoice_number_key" ON "orders"("invoice_number");
CREATE UNIQUE INDEX IF NOT EXISTS "orders_order_number_key" ON "orders"("order_number");
CREATE INDEX IF NOT EXISTS "orders_tracking_number_idx" ON "orders"("tracking_number");
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders"("created_at");

-- User addresses
CREATE TABLE IF NOT EXISTS "user_addresses" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "alternate_phone" TEXT,
  "country" TEXT NOT NULL DEFAULT 'India',
  "state" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "pincode" TEXT NOT NULL,
  "house_no" TEXT NOT NULL,
  "landmark" TEXT,
  "address_type" "AddressType" NOT NULL DEFAULT 'HOME',
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "user_addresses_user_id_idx" ON "user_addresses"("user_id");
CREATE INDEX IF NOT EXISTS "user_addresses_user_id_is_default_idx" ON "user_addresses"("user_id", "is_default");

-- Order timeline (audit log)
CREATE TABLE IF NOT EXISTS "order_timeline" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "from_status" "OrderStatus",
  "to_status" "OrderStatus",
  "actor_id" TEXT,
  "actor_role" TEXT,
  "notes" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_timeline_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_timeline_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "order_timeline_order_id_idx" ON "order_timeline"("order_id");
CREATE INDEX IF NOT EXISTS "order_timeline_created_at_idx" ON "order_timeline"("created_at");

-- Order documents (invoice / label PDFs)
CREATE TABLE IF NOT EXISTS "order_documents" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "document_type" "OrderDocumentType" NOT NULL,
  "file_name" TEXT NOT NULL,
  "storage_path" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL DEFAULT 'application/pdf',
  "version" INTEGER NOT NULL DEFAULT 1,
  "generated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_documents_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "order_documents_order_id_idx" ON "order_documents"("order_id");
CREATE INDEX IF NOT EXISTS "order_documents_order_id_document_type_idx" ON "order_documents"("order_id", "document_type");

-- Order notifications
CREATE TABLE IF NOT EXISTS "order_notifications" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "type" "OrderNotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_notifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "order_notifications_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "order_notifications_user_id_is_read_idx" ON "order_notifications"("user_id", "is_read");
CREATE INDEX IF NOT EXISTS "order_notifications_order_id_idx" ON "order_notifications"("order_id");
