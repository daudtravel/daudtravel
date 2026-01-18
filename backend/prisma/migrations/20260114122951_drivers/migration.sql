-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "license_number" TEXT,
    "experience_years" INTEGER DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "vehicleType" "VehicleType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "drivers_phone_key" ON "drivers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_email_key" ON "drivers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_license_number_key" ON "drivers"("license_number");

-- CreateIndex
CREATE INDEX "drivers_phone_idx" ON "drivers"("phone");

-- CreateIndex
CREATE INDEX "drivers_email_idx" ON "drivers"("email");

-- CreateIndex
CREATE INDEX "drivers_license_number_idx" ON "drivers"("license_number");

-- CreateIndex
CREATE INDEX "drivers_is_active_idx" ON "drivers"("is_active");
