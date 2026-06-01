"use client";

import { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ka, enUS, ru, tr, ar } from "date-fns/locale";
import {
  CalendarDays,
  Clock,
  Car,
  User,
  CreditCard,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Calendar } from "@/src/components/ui/calendar";
import { TimePicker } from "@/src/components/shared/CustomTimePicker";
import { driversAPI, Driver } from "@/src/services/drivers.service";
import { VehicleType } from "@/src/types/transfers.types";
import { VehicleSelector } from "./VehicleSelector";
import { DriverSelector } from "./DriverSelector";

const LOCALE_MAP = { ka, en: enUS, ru, tr, ar };
type VehicleKey = "sedan" | "minivan" | "vito" | "sprinter" | "bus";

interface VehicleOption {
  id: string;
  type: VehicleType;
  price: number;
  maxPersons: number;
}

interface BookingPanelProps {
  transferId: string;
  startLocation: string;
  endLocation: string;
  vehicles: VehicleOption[];
  onBook: (data: BookingData) => void;
}

export interface BookingData {
  transferId: string;
  startLocation: string;
  endLocation: string;
  transferDate: Date;
  transferTime: Date;
  vehicleType: VehicleType;
  paymentAmount: number;
  passengerCount: number;
  driverId?: string;
  driverName?: string;
}

function ColHeader({ step, icon, label }: { step: number; icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 rounded-full bg-brand-green text-white flex items-center justify-center text-xs font-bold shrink-0">
        {step}
      </div>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
        {icon}
        {label}
      </div>
    </div>
  );
}

export function BookingPanel({
  transferId,
  startLocation,
  endLocation,
  vehicles,
  onBook,
}: BookingPanelProps) {
  const t = useTranslations("transfers");
  const locale = useLocale() as keyof typeof LOCALE_MAP;

  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<Date | undefined>(undefined);
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");

  const { data: driversData } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => driversAPI.get(),
    staleTime: 1000 * 60 * 5,
  });

  const drivers: Driver[] = driversData?.data || [];

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId),
    [vehicles, vehicleId]
  );
  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === driverId),
    [drivers, driverId]
  );

  const handleBook = () => {
    if (!selectedVehicle) return;
    onBook({
      transferId,
      startLocation,
      endLocation,
      transferDate: date,
      transferTime: time ?? new Date(),
      vehicleType: selectedVehicle.type,
      paymentAmount: selectedVehicle.price,
      passengerCount: selectedVehicle.maxPersons,
      driverId: driverId || undefined,
      driverName: selectedDriver
        ? `${selectedDriver.firstName} ${selectedDriver.lastName}`
        : undefined,
    });
  };

  const hasDrivers = drivers.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-brand-green px-5 py-4">
        <div className="flex items-center gap-2 text-white flex-wrap">
          <MapPin className="h-4 w-4 text-brand-yellow shrink-0" />
          <span className="font-semibold text-sm">{startLocation}</span>
          <ArrowRight className="h-4 w-4 text-brand-yellow/60 shrink-0" />
          <MapPin className="h-4 w-4 text-brand-cream/80 shrink-0" />
          <span className="font-semibold text-brand-cream text-sm">{endLocation}</span>
        </div>
      </div>

      {/* Steps — single col on mobile, multi-col on md+ */}
      <div className={`grid grid-cols-1 md:divide-x md:divide-gray-100 ${hasDrivers ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {/* Step 1 — Date & Time */}
        <div className="p-5 border-b border-gray-100 md:border-b-0">
          <ColHeader step={1} icon={<CalendarDays className="h-4 w-4" />} label={t("chooseDate")} />
          <div className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50 mb-3">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              className="rounded-xl w-full"
              disabled={{ before: new Date() }}
              locale={LOCALE_MAP[locale]}
            />
          </div>
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="h-3.5 w-3.5 text-brand-green shrink-0" />
            <span className="text-xs font-medium text-gray-600">{t("selectTime")}</span>
          </div>
          <TimePicker value={time} onChange={setTime} placeholder={t("selectTime")} />
          {time && (
            <div className="mt-2 px-3 py-2 bg-brand-green-50 rounded-lg border border-brand-green-100 text-xs text-brand-green font-medium">
              {date.toLocaleDateString()} — {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>

        {/* Step 2 — Vehicle */}
        <div className="p-5 border-b border-gray-100 md:border-b-0">
          <ColHeader step={2} icon={<Car className="h-4 w-4" />} label={t("chooseVehicle")} />
          <VehicleSelector vehicles={vehicles} selectedId={vehicleId} onSelect={setVehicleId} />
        </div>

        {/* Step 3 — Driver (optional) */}
        {hasDrivers && (
          <div className="p-5">
            <ColHeader
              step={3}
              icon={<User className="h-4 w-4" />}
              label={`${t("chooseDriver")} (${t("optional")})`}
            />
            <DriverSelector drivers={drivers} selectedId={driverId} onSelect={setDriverId} />
          </div>
        )}
      </div>

      {/* Summary + Pay */}
      <div className="border-t border-gray-100 px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-brand-green shrink-0" />
              <span className="font-medium text-gray-800">
                {date.toLocaleDateString()}{time ? ` ${time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
              </span>
            </span>
            {selectedVehicle && (
              <span className="flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5 text-brand-green shrink-0" />
                <span className="font-medium text-gray-800">
                  {t(selectedVehicle.type.toLowerCase() as VehicleKey)}
                </span>
                <span className="text-brand-green font-semibold ml-0.5">₾{selectedVehicle.price}</span>
              </span>
            )}
            {selectedDriver && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-brand-green shrink-0" />
                <span className="font-medium text-gray-800">
                  {selectedDriver.firstName} {selectedDriver.lastName}
                </span>
              </span>
            )}
            {!selectedVehicle && (
              <span className="text-gray-400 text-xs italic">{t("chooseVehicle")}</span>
            )}
          </div>

          <button
            onClick={handleBook}
            disabled={!selectedVehicle}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-brand-yellow hover:bg-brand-yellow-dark text-brand-green font-bold text-sm transition-colors disabled:opacity-40 shadow-sm shrink-0"
          >
            <CreditCard className="h-4 w-4" />
            {selectedVehicle ? `${t("pay")} ₾${selectedVehicle.price}` : t("pay")}
          </button>
        </div>
      </div>
    </div>
  );
}
