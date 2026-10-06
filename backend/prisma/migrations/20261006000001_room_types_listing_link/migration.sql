-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('STANDARD_DOUBLE', 'STANDARD_TWIN', 'TRIPLE', 'FAMILY', 'CONNECTING', 'SUPERIOR_DOUBLE', 'SUPERIOR_TRIPLE', 'JUNIOR_SUITE', 'EXECUTIVE_SUITE', 'SUITE', 'DELUXE');

-- AlterTable
ALTER TABLE "accommodation_localizations" ADD COLUMN     "custom_room_types" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "accommodations" ADD COLUMN     "room_types" "RoomType"[] DEFAULT ARRAY[]::"RoomType"[];

-- AlterTable
ALTER TABLE "hotels" ADD COLUMN     "accommodation_id" TEXT,
ADD COLUMN     "custom_room_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "room_types" "RoomType"[] DEFAULT ARRAY[]::"RoomType"[];

-- CreateIndex
CREATE UNIQUE INDEX "hotels_accommodation_id_key" ON "hotels"("accommodation_id");

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_accommodation_id_fkey" FOREIGN KEY ("accommodation_id") REFERENCES "accommodations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
