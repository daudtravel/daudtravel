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
-- AlterTable
ALTER TABLE "insurance_people" ADD COLUMN     "base_amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "discount" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "end_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "final_amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "price_per_day" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "start_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "total_days" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "insurance_settings" DROP COLUMN "pricePerPerson",
ADD COLUMN     "discount_30_days" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "discount_90_days" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "price_per_day" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "insurance_submissions" DROP COLUMN "price_per_person",
ADD COLUMN     "total_days" INTEGER NOT NULL;
