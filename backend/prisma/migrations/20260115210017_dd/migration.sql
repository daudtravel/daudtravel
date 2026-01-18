/*
  Warnings:

  - You are about to drop the `QuickPayment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuickPaymentLink` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."QuickPayment" DROP CONSTRAINT "QuickPayment_linkId_fkey";

-- DropTable
DROP TABLE "public"."QuickPayment";

-- DropTable
DROP TABLE "public"."QuickPaymentLink";

-- CreateTable
CREATE TABLE "quick_payment_links" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_payment_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quick_payment_orders" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "customerFullName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productDescription" TEXT,
    "productPrice" DECIMAL(10,2) NOT NULL,
    "externalOrderId" TEXT NOT NULL,
    "bogOrderId" TEXT NOT NULL,
    "paymentUrl" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "paymentMethod" TEXT,
    "callbackData" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quick_payment_links_slug_key" ON "quick_payment_links"("slug");

-- CreateIndex
CREATE INDEX "quick_payment_links_slug_idx" ON "quick_payment_links"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "quick_payment_orders_externalOrderId_key" ON "quick_payment_orders"("externalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "quick_payment_orders_bogOrderId_key" ON "quick_payment_orders"("bogOrderId");

-- CreateIndex
CREATE INDEX "quick_payment_orders_linkId_idx" ON "quick_payment_orders"("linkId");

-- CreateIndex
CREATE INDEX "quick_payment_orders_externalOrderId_idx" ON "quick_payment_orders"("externalOrderId");

-- CreateIndex
CREATE INDEX "quick_payment_orders_status_createdAt_idx" ON "quick_payment_orders"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "quick_payment_orders" ADD CONSTRAINT "quick_payment_orders_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "quick_payment_links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
