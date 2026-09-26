-- CreateEnum
CREATE TYPE "VehicleOwnership" AS ENUM ('DRIVER', 'COMPANY');

-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "referrer_commission_rate" DECIMAL(5,2),
ADD COLUMN     "referrer_id" TEXT,
ADD COLUMN     "show_on_website" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT,
    "type" "VehicleType" NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "seats" INTEGER NOT NULL DEFAULT 4,
    "plate_number" TEXT,
    "color" TEXT,
    "ownership" "VehicleOwnership" NOT NULL DEFAULT 'DRIVER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicles_driver_id_idx" ON "vehicles"("driver_id");

-- CreateIndex
CREATE INDEX "vehicles_type_idx" ON "vehicles"("type");

-- CreateIndex
CREATE INDEX "vehicles_is_active_idx" ON "vehicles"("is_active");

-- CreateIndex
CREATE INDEX "drivers_is_active_idx" ON "drivers"("is_active");

-- CreateIndex
CREATE INDEX "drivers_show_on_website_idx" ON "drivers"("show_on_website");

-- CreateIndex
CREATE INDEX "drivers_created_by_id_idx" ON "drivers"("created_by_id");

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
