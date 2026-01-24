-- AlterTable
ALTER TABLE "quick_payment_orders" ADD COLUMN     "email_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "email_sent_at" TIMESTAMP(3);
