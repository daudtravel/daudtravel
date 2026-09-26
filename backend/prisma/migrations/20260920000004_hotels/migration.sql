-- CreateEnum
CREATE TYPE "HotelCategory" AS ENUM ('ECONOMY', 'STANDARD', 'COMFORT', 'LUXURY');

-- CreateEnum
CREATE TYPE "HotelContactType" AS ENUM ('MANAGER', 'SALES', 'RESERVATION', 'RECEPTION', 'ACCOUNTING', 'OTHER');

-- CreateTable
CREATE TABLE "hotels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "address" TEXT,
    "stars" INTEGER,
    "category" "HotelCategory" NOT NULL DEFAULT 'STANDARD',
    "price_from" DECIMAL(10,2),
    "price_currency" "Currency",
    "website" TEXT,
    "commission_rate" DECIMAL(5,2),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_contacts" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "type" "HotelContactType" NOT NULL DEFAULT 'RECEPTION',
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "note" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hotels_city_idx" ON "hotels"("city");

-- CreateIndex
CREATE INDEX "hotels_region_idx" ON "hotels"("region");

-- CreateIndex
CREATE INDEX "hotels_category_idx" ON "hotels"("category");

-- CreateIndex
CREATE INDEX "hotels_is_active_idx" ON "hotels"("is_active");

-- CreateIndex
CREATE INDEX "hotels_created_by_id_idx" ON "hotels"("created_by_id");

-- CreateIndex
CREATE INDEX "hotel_contacts_hotel_id_idx" ON "hotel_contacts"("hotel_id");

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_contacts" ADD CONSTRAINT "hotel_contacts_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

