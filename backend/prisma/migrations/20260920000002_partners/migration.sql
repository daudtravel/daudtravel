-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('AGENT', 'TOUR_AGENCY', 'HOTEL_STAFF', 'DRIVER', 'INDIVIDUAL', 'OTHER');

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PartnerType" NOT NULL DEFAULT 'AGENT',
    "phone" TEXT,
    "email" TEXT,
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partners_is_active_idx" ON "partners"("is_active");

-- CreateIndex
CREATE INDEX "partners_created_by_id_idx" ON "partners"("created_by_id");

-- CreateIndex
CREATE INDEX "partners_name_idx" ON "partners"("name");

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
