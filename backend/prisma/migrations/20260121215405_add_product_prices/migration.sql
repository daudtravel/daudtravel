-- AlterTable
ALTER TABLE "quick_payment_links" DROP COLUMN "description",
DROP COLUMN "name";

-- AlterTable
ALTER TABLE "quick_payment_orders" 
ADD COLUMN     "product_locale" TEXT NOT NULL DEFAULT 'ka',
ADD COLUMN     "product_quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "product_total_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "product_unit_price" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Copy old data to new columns
UPDATE "quick_payment_orders" 
SET "product_unit_price" = "productPrice",
    "product_total_price" = "productPrice" * "product_quantity"
WHERE "productPrice" IS NOT NULL;

-- Drop the old column
ALTER TABLE "quick_payment_orders" DROP COLUMN "productPrice";

-- Remove defaults
ALTER TABLE "quick_payment_orders" 
ALTER COLUMN "product_total_price" DROP DEFAULT,
ALTER COLUMN "product_unit_price" DROP DEFAULT;

-- CreateTable
CREATE TABLE "quick_payment_link_localizations" (
    "id" TEXT NOT NULL,
    "link_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'ka',
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "quick_payment_link_localizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quick_payment_link_localizations_locale_idx" ON "quick_payment_link_localizations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "quick_payment_link_localizations_link_id_locale_key" ON "quick_payment_link_localizations"("link_id", "locale");

-- CreateIndex
CREATE INDEX "quick_payment_orders_product_locale_idx" ON "quick_payment_orders"("product_locale");

-- AddForeignKey
ALTER TABLE "quick_payment_link_localizations" ADD CONSTRAINT "quick_payment_link_localizations_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "quick_payment_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;