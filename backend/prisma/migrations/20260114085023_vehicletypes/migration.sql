/*
  Warnings:

  - The values [SUV,VAN,MINIBUS] on the enum `VehicleType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VehicleType_new" AS ENUM ('SEDAN', 'MINIVAN', 'VITO', 'SPRINTER', 'BUS');
ALTER TABLE "transfer_vehicle_types" ALTER COLUMN "type" TYPE "VehicleType_new" USING ("type"::text::"VehicleType_new");
ALTER TABLE "transfer_payment_orders" ALTER COLUMN "vehicle_type" TYPE "VehicleType_new" USING ("vehicle_type"::text::"VehicleType_new");
ALTER TYPE "VehicleType" RENAME TO "VehicleType_old";
ALTER TYPE "VehicleType_new" RENAME TO "VehicleType";
DROP TYPE "public"."VehicleType_old";
COMMIT;
