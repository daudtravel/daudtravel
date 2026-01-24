/*
  Warnings:

  - You are about to drop the column `pricePerPerson` on the `insurance_settings` table. All the data in the column will be lost.
  - You are about to drop the column `price_per_person` on the `insurance_submissions` table. All the data in the column will be lost.
  - Added the required column `base_amount` to the `insurance_people` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_date` to the `insurance_people` table without a default value. This is not possible if the table is not empty.
  - Added the required column `final_amount` to the `insurance_people` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_per_day` to the `insurance_people` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `insurance_people` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_days` to the `insurance_people` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_days` to the `insurance_submissions` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add columns to insurance_settings (these have defaults, so they're safe)
ALTER TABLE "insurance_settings" 
ADD COLUMN "discount_30_days" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN "discount_90_days" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN "price_per_day" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Step 2: Add nullable columns to insurance_people first
ALTER TABLE "insurance_people" 
ADD COLUMN "base_amount" DECIMAL(10,2),
ADD COLUMN "discount" DECIMAL(5,2) DEFAULT 0,
ADD COLUMN "end_date" TIMESTAMP(3),
ADD COLUMN "final_amount" DECIMAL(10,2),
ADD COLUMN "price_per_day" DECIMAL(10,2),
ADD COLUMN "start_date" TIMESTAMP(3),
ADD COLUMN "total_days" INTEGER;

-- Step 3: Update existing NULL values with defaults
UPDATE "insurance_people" 
SET 
  "base_amount" = 0,
  "discount" = 0,
  "end_date" = NOW(),
  "final_amount" = 0,
  "price_per_day" = 0,
  "start_date" = NOW(),
  "total_days" = 1
WHERE "base_amount" IS NULL;

-- Step 4: Make columns NOT NULL after setting defaults
ALTER TABLE "insurance_people" 
ALTER COLUMN "base_amount" SET NOT NULL,
ALTER COLUMN "discount" SET NOT NULL,
ALTER COLUMN "end_date" SET NOT NULL,
ALTER COLUMN "final_amount" SET NOT NULL,
ALTER COLUMN "price_per_day" SET NOT NULL,
ALTER COLUMN "start_date" SET NOT NULL,
ALTER COLUMN "total_days" SET NOT NULL;

-- Step 5: Add nullable column to insurance_submissions first
ALTER TABLE "insurance_submissions" 
ADD COLUMN "total_days" INTEGER;

-- Step 6: Update existing NULL values
UPDATE "insurance_submissions" 
SET "total_days" = 1
WHERE "total_days" IS NULL;

-- Step 7: Make column NOT NULL
ALTER TABLE "insurance_submissions" 
ALTER COLUMN "total_days" SET NOT NULL;

-- Step 8: Drop old columns (safe to do last)
ALTER TABLE "insurance_settings" 
DROP COLUMN IF EXISTS "pricePerPerson";

ALTER TABLE "insurance_submissions" 
DROP COLUMN IF EXISTS "price_per_person";