-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('HOTEL', 'TOUR', 'TRANSFER', 'PACKAGE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingItemType" AS ENUM ('HOTEL', 'TOUR', 'TRANSFER', 'VEHICLE', 'INSURANCE', 'SIM_CARD', 'GUIDE', 'OTHER');

-- CreateEnum
CREATE TYPE "CommissionKind" AS ENUM ('CLIENT_REFERRAL', 'DRIVER_REFERRAL', 'OTHER');

-- CreateTable
CREATE TABLE "bookings" (
    "number" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "type" "BookingType" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "tourist_name" TEXT NOT NULL,
    "tourist_phone" TEXT,
    "tourist_email" TEXT,
    "tourist_country" TEXT,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "currency" "Currency" NOT NULL DEFAULT 'GEL',
    "fx_rate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "total_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_commission" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payment_method" TEXT,
    "referrer_id" TEXT,
    "tour_order_id" TEXT,
    "transfer_order_id" TEXT,
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_items" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "type" "BookingItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "hotel_id" TEXT,
    "room_number" TEXT,
    "room_type" TEXT,
    "check_in" DATE,
    "check_out" DATE,
    "tour_id" TEXT,
    "driver_id" TEXT,
    "vehicle_id" TEXT,
    "service_date" DATE,
    "sale_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cost_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "supplier_paid" BOOLEAN NOT NULL DEFAULT false,
    "supplier_paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_commissions" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "partner_id" TEXT,
    "recipient_name" TEXT NOT NULL,
    "kind" "CommissionKind" NOT NULL DEFAULT 'CLIENT_REFERRAL',
    "driver_id" TEXT,
    "rate" DECIMAL(5,2),
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_number_key" ON "bookings"("number");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_tour_order_id_key" ON "bookings"("tour_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_transfer_order_id_key" ON "bookings"("transfer_order_id");

-- CreateIndex
CREATE INDEX "bookings_type_status_idx" ON "bookings"("type", "status");

-- CreateIndex
CREATE INDEX "bookings_start_date_idx" ON "bookings"("start_date");

-- CreateIndex
CREATE INDEX "bookings_created_by_id_idx" ON "bookings"("created_by_id");

-- CreateIndex
CREATE INDEX "bookings_referrer_id_idx" ON "bookings"("referrer_id");

-- CreateIndex
CREATE INDEX "bookings_tourist_name_idx" ON "bookings"("tourist_name");

-- CreateIndex
CREATE INDEX "booking_items_booking_id_idx" ON "booking_items"("booking_id");

-- CreateIndex
CREATE INDEX "booking_items_hotel_id_idx" ON "booking_items"("hotel_id");

-- CreateIndex
CREATE INDEX "booking_items_driver_id_idx" ON "booking_items"("driver_id");

-- CreateIndex
CREATE INDEX "booking_items_vehicle_id_idx" ON "booking_items"("vehicle_id");

-- CreateIndex
CREATE INDEX "booking_items_tour_id_idx" ON "booking_items"("tour_id");

-- CreateIndex
CREATE INDEX "booking_items_service_date_idx" ON "booking_items"("service_date");

-- CreateIndex
CREATE INDEX "booking_commissions_booking_id_idx" ON "booking_commissions"("booking_id");

-- CreateIndex
CREATE INDEX "booking_commissions_partner_id_idx" ON "booking_commissions"("partner_id");

-- CreateIndex
CREATE INDEX "booking_commissions_paid_idx" ON "booking_commissions"("paid");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tour_order_id_fkey" FOREIGN KEY ("tour_order_id") REFERENCES "tour_payment_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_transfer_order_id_fkey" FOREIGN KEY ("transfer_order_id") REFERENCES "transfer_payment_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_commissions" ADD CONSTRAINT "booking_commissions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_commissions" ADD CONSTRAINT "booking_commissions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_commissions" ADD CONSTRAINT "booking_commissions_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

