"use client";

import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { adminInputClass } from "@/src/components/admin/form/FormFields";
import { useHotelOptions } from "@/src/hooks/admin/useHotels";
import { useDriverOptions } from "@/src/hooks/admin/useDrivers";
import { useVehicleOptions } from "@/src/hooks/admin/useVehicles";
import { useAdminTours } from "@/src/hooks/admin/useAdminLists";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { fullName, formatNumber } from "@/src/utlis/admin/format";
import { pickLocalization } from "@/src/types/admin/website.types";
import {
  ALLOWED_ITEM_TYPES,
  type BookingItemPayload,
  type BookingItemType,
  type BookingType,
} from "@/src/types/admin/bookings.types";
import { cn } from "@/src/utlis/cn";

export const emptyItem = (type: BookingItemType): BookingItemPayload => ({
  type,
  title: "",
  salePrice: null,
  costPrice: null,
});

/** The lines a new booking starts with, per type. */
export function presetItems(type: BookingType): BookingItemPayload[] {
  switch (type) {
    case "HOTEL":
      return [emptyItem("HOTEL")];
    case "TOUR":
      return [emptyItem("TOUR"), emptyItem("VEHICLE")];
    case "TRANSFER":
      return [emptyItem("TRANSFER")];
    case "PACKAGE":
      // The brief's package: hotel + car + the extras that come with it
      return [
        emptyItem("HOTEL"),
        emptyItem("VEHICLE"),
        emptyItem("INSURANCE"),
        emptyItem("SIM_CARD"),
      ];
    default:
      return [emptyItem("OTHER")];
  }
}

export default function BookingItemsField({
  bookingType,
  value,
  onChange,
  currency,
  disabled,
}: {
  bookingType: BookingType;
  value: BookingItemPayload[];
  onChange: (value: BookingItemPayload[]) => void;
  currency: string;
  disabled?: boolean;
}) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { can } = usePermissions();

  const hotels = useHotelOptions();
  const drivers = useDriverOptions();
  const vehicles = useVehicleOptions();
  const tours = useAdminTours({ limit: 100, sortBy: "createdAt" });
  const canSeeTours = can("WEBSITE");

  const allowed = ALLOWED_ITEM_TYPES[bookingType];

  const update = (index: number, patch: Partial<BookingItemPayload>) =>
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const remove = (index: number) =>
    onChange(value.filter((_, i) => i !== index));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  /** Choosing a hotel fills the title and suggests our cost from its commission. */
  const onHotelChange = (index: number, hotelId: string) => {
    const hotel = hotels.data?.find((h) => h.id === hotelId);
    const item = value[index];
    const patch: Partial<BookingItemPayload> = { hotelId: hotelId || null };
    if (hotel) {
      if (!item.title.trim()) patch.title = hotel.name;
      const sale = Number(item.salePrice ?? 0);
      if (
        hotel.commissionRate !== null &&
        sale > 0 &&
        (item.costPrice === null || item.costPrice === undefined)
      ) {
        patch.costPrice =
          Math.round(sale * (1 - hotel.commissionRate / 100) * 100) / 100;
      }
    }
    update(index, patch);
  };

  const onDriverChange = (index: number, driverId: string) => {
    const driver = drivers.data?.find((d) => d.id === driverId);
    const item = value[index];
    const patch: Partial<BookingItemPayload> = { driverId: driverId || null };
    // Offer the driver's own car when only one is on file
    if (driver?.vehicles.length === 1 && !item.vehicleId) {
      patch.vehicleId = driver.vehicles[0].id;
      if (!item.title.trim()) {
        patch.title = `${driver.vehicles[0].brand} ${driver.vehicles[0].model}`;
      }
    }
    update(index, patch);
  };

  const numberInput = (
    index: number,
    field: "salePrice" | "costPrice",
    label: string
  ) => (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label} ({currency})
      </span>
      <Input
        value={value[index][field] ?? ""}
        onChange={(e) => {
          const raw = e.target.value.replace(",", ".");
          update(index, {
            [field]: raw.trim() === "" ? null : Number(raw),
          } as Partial<BookingItemPayload>);
        }}
        inputMode="decimal"
        disabled={disabled}
        className={cn(adminInputClass, "h-10 text-end tabular-nums")}
      />
    </label>
  );

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
          {t("bookings.noItems")}
        </p>
      )}

      {value.map((item, index) => {
        const profit =
          (Number(item.salePrice ?? 0) || 0) -
          (Number(item.costPrice ?? 0) || 0);
        return (
          <div
            key={index}
            className="rounded-xl border border-gray-200 bg-gray-50/50 p-3"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  aria-label={t("hotels.moveUp")}
                  disabled={disabled || index === 0}
                  onClick={() => move(index, -1)}
                  className="text-gray-300 transition-colors hover:text-brand-green disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={t("hotels.moveDown")}
                  disabled={disabled || index === value.length - 1}
                  onClick={() => move(index, 1)}
                  className="text-gray-300 transition-colors hover:text-brand-green disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <Select
                value={item.type}
                onValueChange={(next) =>
                  update(index, { type: next as BookingItemType })
                }
                disabled={disabled}
              >
                <SelectTrigger className="h-10 w-44 rounded-xl border-gray-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowed.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`bookings.itemTypes.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={item.title}
                onChange={(e) => update(index, { title: e.target.value })}
                placeholder={t("bookings.itemTitle")}
                disabled={disabled}
                maxLength={200}
                className={cn(
                  adminInputClass,
                  "h-10 min-w-[12rem] flex-1 bg-white"
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                onClick={() => remove(index)}
                aria-label={t("common.delete")}
                className="shrink-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 />
              </Button>
            </div>

            {/* Fields that depend on what the line is */}
            {item.type === "HOTEL" && (
              <div className="mb-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <label className="block lg:col-span-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("nav.hotels")}
                  </span>
                  <Select
                    value={item.hotelId ?? "__none__"}
                    onValueChange={(next) =>
                      onHotelChange(index, next === "__none__" ? "" : next)
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="__none__">
                        {t("bookings.noHotel")}
                      </SelectItem>
                      {(hotels.data ?? []).map((hotel) => (
                        <SelectItem key={hotel.id} value={hotel.id}>
                          {hotel.name} · {hotel.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("bookings.roomNumber")}
                  </span>
                  <Input
                    value={item.roomNumber ?? ""}
                    onChange={(e) =>
                      update(index, { roomNumber: e.target.value })
                    }
                    disabled={disabled}
                    maxLength={40}
                    className={cn(adminInputClass, "h-10 bg-white")}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("bookings.checkIn")}
                  </span>
                  <Input
                    type="date"
                    value={item.checkIn ?? ""}
                    onChange={(e) =>
                      update(index, { checkIn: e.target.value || null })
                    }
                    disabled={disabled}
                    className={cn(adminInputClass, "h-10 bg-white")}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("bookings.checkOut")}
                  </span>
                  <Input
                    type="date"
                    value={item.checkOut ?? ""}
                    onChange={(e) =>
                      update(index, { checkOut: e.target.value || null })
                    }
                    disabled={disabled}
                    className={cn(adminInputClass, "h-10 bg-white")}
                  />
                </label>
              </div>
            )}

            {(item.type === "VEHICLE" ||
              item.type === "TRANSFER" ||
              item.type === "TOUR" ||
              item.type === "GUIDE") && (
              <div className="mb-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("vehicles.driver")}
                  </span>
                  <Select
                    value={item.driverId ?? "__none__"}
                    onValueChange={(next) =>
                      onDriverChange(index, next === "__none__" ? "" : next)
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="__none__">
                        {t("vehicles.noDriver")}
                      </SelectItem>
                      {(drivers.data ?? []).map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {fullName(driver)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("vehicles.vehicle")}
                  </span>
                  <Select
                    value={item.vehicleId ?? "__none__"}
                    onValueChange={(next) =>
                      update(index, {
                        vehicleId: next === "__none__" ? null : next,
                      })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="__none__">
                        {t("bookings.noVehicle")}
                      </SelectItem>
                      {(vehicles.data ?? [])
                        .filter(
                          (vehicle) =>
                            !item.driverId || vehicle.driverId === item.driverId
                        )
                        .map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.brand} {vehicle.model}
                            {vehicle.year ? ` · ${vehicle.year}` : ""}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </label>
                {item.type === "TOUR" && canSeeTours && (
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {t("nav.websiteTours")}
                    </span>
                    <Select
                      value={item.tourId ?? "__none__"}
                      onValueChange={(next) => {
                        const tourId = next === "__none__" ? null : next;
                        const tour = tours.data?.data.find(
                          (row) => row.id === tourId
                        );
                        const name = pickLocalization(
                          tour?.localizations,
                          locale
                        )?.name;
                        update(index, {
                          tourId,
                          ...(name && !item.title.trim()
                            ? { title: name }
                            : {}),
                        });
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        <SelectItem value="__none__">
                          {t("bookings.noTour")}
                        </SelectItem>
                        {(tours.data?.data ?? []).map((tour) => (
                          <SelectItem key={tour.id} value={tour.id}>
                            {pickLocalization(tour.localizations, locale)
                              ?.name ?? tour.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                )}
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("bookings.serviceDate")}
                  </span>
                  <Input
                    type="date"
                    value={item.serviceDate ?? ""}
                    onChange={(e) =>
                      update(index, { serviceDate: e.target.value || null })
                    }
                    disabled={disabled}
                    className={cn(adminInputClass, "h-10 bg-white")}
                  />
                </label>
              </div>
            )}

            {(item.type === "INSURANCE" ||
              item.type === "SIM_CARD" ||
              item.type === "OTHER") && (
              <div className="mb-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("bookings.serviceDate")}
                  </span>
                  <Input
                    type="date"
                    value={item.serviceDate ?? ""}
                    onChange={(e) =>
                      update(index, { serviceDate: e.target.value || null })
                    }
                    disabled={disabled}
                    className={cn(adminInputClass, "h-10 bg-white")}
                  />
                </label>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {numberInput(index, "salePrice", t("bookings.salePrice"))}
              {numberInput(index, "costPrice", t("bookings.costPrice"))}
              <div className="flex items-end">
                <p
                  className={cn(
                    "w-full rounded-xl border border-dashed px-3 py-2 text-end text-sm font-semibold tabular-nums",
                    profit < 0
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-gray-200 text-gray-700"
                  )}
                >
                  <span className="float-start text-xs font-normal uppercase tracking-wide text-gray-400">
                    {t("bookings.itemProfit")}
                  </span>
                  {formatNumber(profit, locale, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("common.notes")}
                </span>
                <Input
                  value={item.notes ?? ""}
                  onChange={(e) => update(index, { notes: e.target.value })}
                  disabled={disabled}
                  maxLength={1000}
                  className={cn(adminInputClass, "h-10 bg-white")}
                />
              </label>
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2">
        {allowed.map((type) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onChange([...value, emptyItem(type)])}
          >
            <Plus />
            {t(`bookings.itemTypes.${type}`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
