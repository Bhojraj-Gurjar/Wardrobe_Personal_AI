-- Migrate legacy DELIVERED orders into COMPLETED (single final stage).
UPDATE "orders"
SET
  "status" = 'COMPLETED',
  "completed_at" = COALESCE("completed_at", "delivered_at", NOW()),
  "delivered_at" = COALESCE("delivered_at", "completed_at", NOW())
WHERE "status" = 'DELIVERED';
