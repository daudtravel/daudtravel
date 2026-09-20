-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "balance_due" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "bookings_balance_due_idx" ON "bookings"("balance_due");

