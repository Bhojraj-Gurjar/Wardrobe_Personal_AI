-- Remove the incorrect universal default that marked every product as a T-Shirt.
ALTER TABLE "products" ALTER COLUMN "product_type" DROP DEFAULT;
