-- CreateEnum
CREATE TYPE "CatalogCategory" AS ENUM ('TOUR', 'TRANSFER', 'HOTEL', 'VEHICLE', 'INSURANCE', 'SIM_CARD', 'PACKAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "CatalogUnit" AS ENUM ('PER_PERSON', 'PER_GROUP', 'PER_NIGHT', 'PER_DAY', 'PER_TRIP', 'PER_ITEM');

-- CreateEnum
CREATE TYPE "CatalogSeason" AS ENUM ('ALL_YEAR', 'HIGH', 'LOW');

-- CreateTable
CREATE TABLE "catalog_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CatalogCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "unit" "CatalogUnit" NOT NULL DEFAULT 'PER_PERSON',
    "price" DECIMAL(12,2) NOT NULL,
    "cost" DECIMAL(12,2),
    "currency" "Currency" NOT NULL DEFAULT 'GEL',
    "vehicleType" "VehicleType",
    "city" TEXT,
    "season" "CatalogSeason" NOT NULL DEFAULT 'ALL_YEAR',
    "valid_from" DATE,
    "valid_to" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catalog_items_category_idx" ON "catalog_items"("category");

-- CreateIndex
CREATE INDEX "catalog_items_is_active_idx" ON "catalog_items"("is_active");

-- CreateIndex
CREATE INDEX "catalog_items_city_idx" ON "catalog_items"("city");

-- CreateIndex
CREATE INDEX "catalog_items_created_by_id_idx" ON "catalog_items"("created_by_id");

-- AddForeignKey
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

