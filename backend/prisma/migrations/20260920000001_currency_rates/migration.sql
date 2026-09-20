-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('GEL', 'USD', 'EUR', 'TRY', 'RUB', 'AED', 'SAR');

-- CreateEnum
CREATE TYPE "RateSource" AS ENUM ('NBG', 'EXCHANGERATE_API', 'MANUAL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "preferred_currency" "Currency" NOT NULL DEFAULT 'GEL';

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "date" DATE NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "source" "RateSource" NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exchange_rates_date_idx" ON "exchange_rates"("date");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_currency_date_key" ON "exchange_rates"("currency", "date");
