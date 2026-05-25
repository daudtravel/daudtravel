-- CreateTable
CREATE TABLE "driver_reviews" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "reviewer_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_reviews_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "transfer_payment_orders" ADD COLUMN "driver_id" TEXT;

-- CreateIndex
CREATE INDEX "driver_reviews_driver_id_idx" ON "driver_reviews"("driver_id");

-- AddForeignKey
ALTER TABLE "driver_reviews" ADD CONSTRAINT "driver_reviews_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_payment_orders" ADD CONSTRAINT "transfer_payment_orders_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
