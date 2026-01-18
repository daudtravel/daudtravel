/*
  Warnings:

  - Added the required column `transfer_end_location` to the `transfer_payment_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transfer_start_location` to the `transfer_payment_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transfer_payment_orders" ADD COLUMN     "transfer_end_location" TEXT NOT NULL,
ADD COLUMN     "transfer_locale" TEXT NOT NULL DEFAULT 'ka',
ADD COLUMN     "transfer_start_location" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "transfer_payment_orders_transfer_locale_idx" ON "transfer_payment_orders"("transfer_locale");
