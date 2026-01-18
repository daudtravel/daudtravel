-- CreateEnum
CREATE TYPE "TourType" AS ENUM ('GROUP', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('SEDAN', 'SUV', 'VAN', 'MINIBUS');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "tours" (
    "id" TEXT NOT NULL,
    "type" "TourType" NOT NULL DEFAULT 'GROUP',
    "days" INTEGER NOT NULL DEFAULT 1,
    "nights" INTEGER NOT NULL DEFAULT 0,
    "max_persons" INTEGER,
    "start_date" TIMESTAMP(3),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_daily" BOOLEAN NOT NULL DEFAULT false,
    "main_image" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_localizations" (
    "id" TEXT NOT NULL,
    "tour_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'ka',
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_location" TEXT NOT NULL,
    "locations" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "tour_localizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_images" (
    "id" TEXT NOT NULL,
    "tour_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tour_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_pricing" (
    "id" TEXT NOT NULL,
    "tour_id" TEXT NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "reservation_price" DECIMAL(10,2) NOT NULL,
    "discounted_price" DECIMAL(10,2),

    CONSTRAINT "group_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individual_pricing" (
    "id" TEXT NOT NULL,
    "tour_id" TEXT NOT NULL,
    "season_total_price" DECIMAL(10,2) NOT NULL,
    "season_reservation_price" DECIMAL(10,2) NOT NULL,
    "season_discounted_price" DECIMAL(10,2) NOT NULL,
    "off_season_total_price" DECIMAL(10,2) NOT NULL,
    "off_season_reservation_price" DECIMAL(10,2) NOT NULL,
    "off_season_discounted_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "individual_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_localizations" (
    "id" TEXT NOT NULL,
    "transfer_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'ka',
    "start_location" TEXT NOT NULL,
    "end_location" TEXT NOT NULL,

    CONSTRAINT "transfer_localizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_vehicle_types" (
    "id" TEXT NOT NULL,
    "transfer_id" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "max_persons" INTEGER NOT NULL,

    CONSTRAINT "transfer_vehicle_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_payment_orders" (
    "id" TEXT NOT NULL,
    "tour_id" TEXT NOT NULL,
    "external_order_id" TEXT NOT NULL,
    "bog_order_id" TEXT NOT NULL,
    "customer_first_name" TEXT NOT NULL,
    "customer_last_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "people_count" INTEGER NOT NULL,
    "selected_date" TIMESTAMP(3) NOT NULL,
    "tour_locale" TEXT NOT NULL DEFAULT 'ka',
    "tour_name" TEXT NOT NULL,
    "tour_description" TEXT,
    "tour_duration_days" INTEGER NOT NULL DEFAULT 1,
    "tour_duration_nights" INTEGER NOT NULL DEFAULT 0,
    "start_location" TEXT NOT NULL,
    "end_location" TEXT NOT NULL,
    "locations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_full_payment" BOOLEAN NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "paid_amount" DECIMAL(10,2) NOT NULL,
    "remaining_amount" DECIMAL(10,2),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_url" TEXT,
    "transaction_id" TEXT,
    "payment_method" TEXT,
    "rejection_reason" TEXT,
    "callback_data" JSONB,
    "expires_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tour_payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_payment_orders" (
    "id" TEXT NOT NULL,
    "transfer_id" TEXT NOT NULL,
    "external_order_id" TEXT NOT NULL,
    "bog_order_id" TEXT NOT NULL,
    "customer_first_name" TEXT NOT NULL,
    "customer_last_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "passenger_count" INTEGER NOT NULL,
    "transfer_date" TIMESTAMP(3) NOT NULL,
    "transfer_time" TIMESTAMP(3) NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "payment_amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_url" TEXT,
    "transaction_id" TEXT,
    "payment_method" TEXT,
    "rejection_reason" TEXT,
    "callback_data" JSONB,
    "refunded_amount" DECIMAL(10,2),
    "refunded_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verifications" (
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE INDEX "tours_type_is_public_is_daily_idx" ON "tours"("type", "is_public", "is_daily");

-- CreateIndex
CREATE INDEX "tour_localizations_locale_idx" ON "tour_localizations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "tour_localizations_tour_id_locale_key" ON "tour_localizations"("tour_id", "locale");

-- CreateIndex
CREATE INDEX "tour_images_tour_id_idx" ON "tour_images"("tour_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_pricing_tour_id_key" ON "group_pricing"("tour_id");

-- CreateIndex
CREATE UNIQUE INDEX "individual_pricing_tour_id_key" ON "individual_pricing"("tour_id");

-- CreateIndex
CREATE INDEX "transfer_localizations_locale_idx" ON "transfer_localizations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_localizations_transfer_id_locale_key" ON "transfer_localizations"("transfer_id", "locale");

-- CreateIndex
CREATE INDEX "transfer_vehicle_types_transfer_id_idx" ON "transfer_vehicle_types"("transfer_id");

-- CreateIndex
CREATE UNIQUE INDEX "tour_payment_orders_external_order_id_key" ON "tour_payment_orders"("external_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "tour_payment_orders_bog_order_id_key" ON "tour_payment_orders"("bog_order_id");

-- CreateIndex
CREATE INDEX "tour_payment_orders_status_created_at_idx" ON "tour_payment_orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "tour_payment_orders_tour_locale_idx" ON "tour_payment_orders"("tour_locale");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_payment_orders_external_order_id_key" ON "transfer_payment_orders"("external_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_payment_orders_bog_order_id_key" ON "transfer_payment_orders"("bog_order_id");

-- CreateIndex
CREATE INDEX "transfer_payment_orders_status_created_at_idx" ON "transfer_payment_orders"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "email_verifications_expires_at_idx" ON "email_verifications"("expires_at");

-- AddForeignKey
ALTER TABLE "tour_localizations" ADD CONSTRAINT "tour_localizations_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_images" ADD CONSTRAINT "tour_images_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_pricing" ADD CONSTRAINT "group_pricing_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_pricing" ADD CONSTRAINT "individual_pricing_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_localizations" ADD CONSTRAINT "transfer_localizations_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_vehicle_types" ADD CONSTRAINT "transfer_vehicle_types_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_payment_orders" ADD CONSTRAINT "tour_payment_orders_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_payment_orders" ADD CONSTRAINT "transfer_payment_orders_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
