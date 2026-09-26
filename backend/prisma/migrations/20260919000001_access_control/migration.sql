-- CreateEnum
CREATE TYPE "PermissionModule" AS ENUM ('BOOKINGS_HOTEL', 'BOOKINGS_TOUR', 'BOOKINGS_PACKAGE', 'DRIVERS', 'HOTELS', 'PARTNERS', 'TRANSACTIONS', 'FINANCE', 'CATALOG', 'CALENDAR', 'CURRENCY', 'WEBSITE', 'ONLINE_ORDERS');

-- CreateEnum
CREATE TYPE "AccessScope" AS ENUM ('OWN', 'ALL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "sessions_revoked_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "module" "PermissionModule" NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "scope" "AccessScope" NOT NULL DEFAULT 'OWN',

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","module")
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RoleToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data: until now every account could open the admin panel. Non-admin accounts
-- are leftovers of the disabled public sign-up, so they start deactivated; the
-- admin can re-activate them and assign roles from the Users page.
UPDATE "users" SET "is_active" = false WHERE "is_admin" = false;

-- Data: default roles (fully editable/deletable by the admin afterwards)
INSERT INTO "roles" ("id", "name", "description", "updated_at") VALUES
  ('role_default_hotel_reservations', 'Hotel reservations', 'Hotel bookings (own records), hotel directory, calendar', CURRENT_TIMESTAMP),
  ('role_default_tour_reservations', 'Tour reservations', 'Tour and transfer bookings (own records), own drivers, calendar', CURRENT_TIMESTAMP),
  ('role_default_reservations_manager', 'Reservations manager', 'All hotel, tour and package bookings of every employee', CURRENT_TIMESTAMP),
  ('role_default_driver_coordinator', 'Driver coordinator', 'Drivers and vehicles (own records)', CURRENT_TIMESTAMP),
  ('role_default_accountant', 'Accountant', 'Income, expenses and finance reports', CURRENT_TIMESTAMP),
  ('role_default_content_manager', 'Content manager', 'Website content and online orders', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "module", "can_view", "can_create", "can_edit", "can_delete", "scope") VALUES
  -- Hotel reservations
  ('role_default_hotel_reservations', 'BOOKINGS_HOTEL', true, true, true, false, 'OWN'),
  ('role_default_hotel_reservations', 'HOTELS', true, true, true, false, 'ALL'),
  ('role_default_hotel_reservations', 'PARTNERS', true, true, false, false, 'ALL'),
  ('role_default_hotel_reservations', 'CATALOG', true, false, false, false, 'ALL'),
  ('role_default_hotel_reservations', 'CALENDAR', true, true, true, true, 'OWN'),
  ('role_default_hotel_reservations', 'CURRENCY', true, false, false, false, 'ALL'),
  -- Tour reservations
  ('role_default_tour_reservations', 'BOOKINGS_TOUR', true, true, true, false, 'OWN'),
  ('role_default_tour_reservations', 'DRIVERS', true, true, true, false, 'OWN'),
  ('role_default_tour_reservations', 'PARTNERS', true, true, false, false, 'ALL'),
  ('role_default_tour_reservations', 'CATALOG', true, false, false, false, 'ALL'),
  ('role_default_tour_reservations', 'CALENDAR', true, true, true, true, 'OWN'),
  ('role_default_tour_reservations', 'CURRENCY', true, false, false, false, 'ALL'),
  -- Reservations manager
  ('role_default_reservations_manager', 'BOOKINGS_HOTEL', true, true, true, true, 'ALL'),
  ('role_default_reservations_manager', 'BOOKINGS_TOUR', true, true, true, true, 'ALL'),
  ('role_default_reservations_manager', 'BOOKINGS_PACKAGE', true, true, true, true, 'ALL'),
  ('role_default_reservations_manager', 'HOTELS', true, true, true, false, 'ALL'),
  ('role_default_reservations_manager', 'DRIVERS', true, true, true, false, 'ALL'),
  ('role_default_reservations_manager', 'PARTNERS', true, true, true, false, 'ALL'),
  ('role_default_reservations_manager', 'CATALOG', true, true, true, false, 'ALL'),
  ('role_default_reservations_manager', 'CALENDAR', true, true, true, true, 'ALL'),
  ('role_default_reservations_manager', 'CURRENCY', true, false, false, false, 'ALL'),
  ('role_default_reservations_manager', 'ONLINE_ORDERS', true, false, false, false, 'ALL'),
  -- Driver coordinator
  ('role_default_driver_coordinator', 'DRIVERS', true, true, true, true, 'OWN'),
  ('role_default_driver_coordinator', 'PARTNERS', true, true, false, false, 'ALL'),
  ('role_default_driver_coordinator', 'CALENDAR', true, true, true, true, 'OWN'),
  ('role_default_driver_coordinator', 'CURRENCY', true, false, false, false, 'ALL'),
  -- Accountant
  ('role_default_accountant', 'TRANSACTIONS', true, true, true, true, 'ALL'),
  ('role_default_accountant', 'FINANCE', true, false, false, false, 'ALL'),
  ('role_default_accountant', 'BOOKINGS_HOTEL', true, false, false, false, 'ALL'),
  ('role_default_accountant', 'BOOKINGS_TOUR', true, false, false, false, 'ALL'),
  ('role_default_accountant', 'BOOKINGS_PACKAGE', true, false, false, false, 'ALL'),
  ('role_default_accountant', 'HOTELS', true, false, false, false, 'ALL'),
  ('role_default_accountant', 'DRIVERS', true, false, false, false, 'ALL'),
  ('role_default_accountant', 'PARTNERS', true, false, false, false, 'ALL'),
  ('role_default_accountant', 'CATALOG', true, false, false, false, 'ALL'),
  ('role_default_accountant', 'CURRENCY', true, true, true, false, 'ALL'),
  ('role_default_accountant', 'ONLINE_ORDERS', true, false, false, false, 'ALL'),
  ('role_default_accountant', 'CALENDAR', true, true, true, true, 'OWN'),
  -- Content manager
  ('role_default_content_manager', 'WEBSITE', true, true, true, true, 'ALL'),
  ('role_default_content_manager', 'ONLINE_ORDERS', true, false, false, false, 'ALL'),
  ('role_default_content_manager', 'CALENDAR', true, true, true, true, 'OWN'),
  ('role_default_content_manager', 'CURRENCY', true, false, false, false, 'ALL')
ON CONFLICT DO NOTHING;
