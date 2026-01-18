-- DropForeignKey
ALTER TABLE "public"."quick_payment_orders" DROP CONSTRAINT "quick_payment_orders_linkId_fkey";

-- AlterTable
ALTER TABLE "quick_payment_orders" ALTER COLUMN "linkId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "quick_payment_orders" ADD CONSTRAINT "quick_payment_orders_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "quick_payment_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;
