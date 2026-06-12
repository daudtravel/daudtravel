-- CreateEnum
CREATE TYPE "AccommodationType" AS ENUM ('HOTEL', 'APARTMENT');

-- CreateTable
CREATE TABLE "accommodations" (
    "id" TEXT NOT NULL,
    "type" "AccommodationType" NOT NULL DEFAULT 'HOTEL',
    "price" DECIMAL(10,2) NOT NULL,
    "city" TEXT NOT NULL,
    "max_guests" INTEGER NOT NULL DEFAULT 1,
    "bedrooms" INTEGER NOT NULL DEFAULT 1,
    "bathrooms" INTEGER NOT NULL DEFAULT 1,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "main_image" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accommodations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accommodation_localizations" (
    "id" TEXT NOT NULL,
    "accommodation_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'ka',
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "accommodation_localizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accommodation_images" (
    "id" TEXT NOT NULL,
    "accommodation_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accommodation_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accommodations_type_is_public_idx" ON "accommodations"("type", "is_public");

-- CreateIndex
CREATE INDEX "accommodations_city_idx" ON "accommodations"("city");

-- CreateIndex
CREATE INDEX "accommodation_localizations_locale_idx" ON "accommodation_localizations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "accommodation_localizations_accommodation_id_locale_key" ON "accommodation_localizations"("accommodation_id", "locale");

-- CreateIndex
CREATE INDEX "accommodation_images_accommodation_id_idx" ON "accommodation_images"("accommodation_id");

-- AddForeignKey
ALTER TABLE "accommodation_localizations" ADD CONSTRAINT "accommodation_localizations_accommodation_id_fkey" FOREIGN KEY ("accommodation_id") REFERENCES "accommodations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accommodation_images" ADD CONSTRAINT "accommodation_images_accommodation_id_fkey" FOREIGN KEY ("accommodation_id") REFERENCES "accommodations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
