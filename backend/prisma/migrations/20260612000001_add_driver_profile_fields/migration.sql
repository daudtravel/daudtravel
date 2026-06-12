-- AlterTable
ALTER TABLE "drivers" ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "drivers" ADD COLUMN "daily_rent_price" DECIMAL(10,2);
ALTER TABLE "drivers" ADD COLUMN "car_photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
