/*
  Warnings:

  - You are about to drop the column `email` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `experience_years` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `license_number` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleType` on the `drivers` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."drivers_email_idx";

-- DropIndex
DROP INDEX "public"."drivers_email_key";

-- DropIndex
DROP INDEX "public"."drivers_is_active_idx";

-- DropIndex
DROP INDEX "public"."drivers_license_number_idx";

-- DropIndex
DROP INDEX "public"."drivers_license_number_key";

-- DropIndex
DROP INDEX "public"."drivers_phone_idx";

-- DropIndex
DROP INDEX "public"."drivers_phone_key";

-- AlterTable
ALTER TABLE "drivers" DROP COLUMN "email",
DROP COLUMN "experience_years",
DROP COLUMN "is_active",
DROP COLUMN "license_number",
DROP COLUMN "notes",
DROP COLUMN "phone",
DROP COLUMN "vehicleType",
ADD COLUMN     "photo" TEXT;
