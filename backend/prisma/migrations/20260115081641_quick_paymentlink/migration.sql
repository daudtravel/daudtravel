-- CreateTable
CREATE TABLE "QuickPaymentLink" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "paymentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickPaymentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickPayment" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "externalOrderId" TEXT NOT NULL,
    "bogOrderId" TEXT NOT NULL,
    "paymentUrl" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuickPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuickPaymentLink_slug_key" ON "QuickPaymentLink"("slug");

-- CreateIndex
CREATE INDEX "QuickPaymentLink_slug_idx" ON "QuickPaymentLink"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "QuickPayment_externalOrderId_key" ON "QuickPayment"("externalOrderId");

-- CreateIndex
CREATE INDEX "QuickPayment_linkId_idx" ON "QuickPayment"("linkId");

-- CreateIndex
CREATE INDEX "QuickPayment_externalOrderId_idx" ON "QuickPayment"("externalOrderId");

-- CreateIndex
CREATE INDEX "QuickPayment_status_idx" ON "QuickPayment"("status");

-- AddForeignKey
ALTER TABLE "QuickPayment" ADD CONSTRAINT "QuickPayment_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "QuickPaymentLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
