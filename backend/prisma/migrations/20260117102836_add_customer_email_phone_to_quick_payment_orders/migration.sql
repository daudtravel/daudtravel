/*
  Warnings:

  - Added the required column `customerEmail` to the `quick_payment_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "quick_payment_orders" ADD COLUMN     "customerEmail" TEXT NOT NULL,
ADD COLUMN     "customerPhone" TEXT;

-- CreateIndex
CREATE INDEX "quick_payment_orders_customerEmail_idx" ON "quick_payment_orders"("customerEmail");
