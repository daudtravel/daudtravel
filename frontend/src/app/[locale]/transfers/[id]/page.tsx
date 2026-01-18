"use client";

import { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Calendar } from "@/src/components/ui/calendar";
import { ka, enUS, ru, tr, ar } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import {
  ArrowRight,
  Calendar as CalendarIcon,
  Car,
  Clock,
  User,
  Truck,
  Bus as BusIcon,
  CreditCard,
} from "lucide-react";
import { TimePicker } from "@/src/components/shared/CustomTimePicker";
import TransferPaymentModal from "./_components/TransferPaymentModal";
import TourLoader from "@/src/components/shared/loader/TourLoader";
import { VehicleType } from "@/src/types/transfers.types";
import { useTransferById } from "@/src/hooks/transfers/useTransfersById";

interface TransferBookingData {
  transferId: string;
  startLocation: string;
  endLocation: string;
  transferDate: Date;
  transferTime: Date;
  vehicleType: VehicleType;
  paymentAmount: number;
  passengerCount: number;
}
// Vehicle icons mapping
const VEHICLE_ICONS: Record<VehicleType, typeof Car> = {
  [VehicleType.SEDAN]: Car,
  [VehicleType.MINIVAN]: Car,
  [VehicleType.VITO]: Truck,
  [VehicleType.SPRINTER]: BusIcon,
  [VehicleType.BUS]: BusIcon,
};

const localeMap = {
  ka,
  en: enUS,
  ru,
  tr,
  ar,
};

export default function TransferDetailsPage() {
  const t = useTranslations("transfers");
  const locale = useLocale() as keyof typeof localeMap;
  const params = useParams();

  const transferId = params.id as string;

  const currentDateTime = new Date();
  const [selectedDateTime, setSelectedDateTime] = useState<{
    date: Date;
    time: Date;
  }>({
    date: currentDateTime,
    time: currentDateTime,
  });

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const {
    data: response,
    isLoading,
    isError,
  } = useTransferById(transferId, locale);

  const transfer = response?.data;
  const localization = transfer?.localizations?.[0];
  const availableVehicleTypes = transfer?.vehicleTypes || [];
  const startLocation = localization?.startLocation || "N/A";
  const endLocation = localization?.endLocation || "N/A";

  const selectedVehicle = useMemo(() => {
    return availableVehicleTypes.find((vt) => vt.id === selectedVehicleId);
  }, [availableVehicleTypes, selectedVehicleId]);

  const currentPrice = useMemo(() => {
    return selectedVehicle?.price || null;
  }, [selectedVehicle]);

  const passengerCapacity = useMemo(() => {
    if (!selectedVehicle) return 0;
    return selectedVehicle.maxPersons;
  }, [selectedVehicle]);

  const handlePayment = () => {
    setIsPaymentModalOpen(true);
  };

  const handlePaymentModalClose = () => {
    setIsPaymentModalOpen(false);
  };

  const getBookingData = (): TransferBookingData | null => {
    if (!transfer || !selectedVehicle || !selectedDateTime.time) {
      return null;
    }

    return {
      transferId: transfer.id,
      startLocation,
      endLocation,
      transferDate: selectedDateTime.date,
      transferTime: selectedDateTime.time,
      vehicleType: selectedVehicle.type,
      paymentAmount: selectedVehicle.price,
      passengerCount: selectedVehicle.maxPersons,
    };
  };

  const renderPassengerIcons = (capacity: number) => {
    if (capacity <= 4) {
      return (
        <div className="flex items-center ml-2">
          {[...Array(capacity)].map((_, i) => (
            <User key={i} className="h-4 w-4 text-gray-600" />
          ))}
        </div>
      );
    } else {
      return (
        <div className="flex items-center ml-2">
          <User className="h-4 w-4 text-gray-600" />
          <span className="text-xs text-gray-600 ml-1">x{capacity}</span>
        </div>
      );
    }
  };

  const renderVehicleIcon = (vehicleType: VehicleType) => {
    const IconComponent = VEHICLE_ICONS[vehicleType] || Car;
    return <IconComponent className="h-4 w-4 text-gray-700 mr-2" />;
  };

  const getVehicleTypeName = (type: VehicleType) => {
    return t(`vehicleType.${type}`) || type;
  };

  if (isLoading) {
    return <TourLoader />;
  }

  if (isError || !transfer) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">
              {t("errorLoadingTransfer") || "Error loading transfer details"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 min-h-screen">
      <Card className="overflow-hidden border-t-2 border-t-main shadow-xl">
        <CardHeader className="bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="font-bold">{startLocation}</span>
                <ArrowRight className="h-5 w-5" />
                <span className="font-bold">{endLocation}</span>
              </CardTitle>
              <CardDescription className="mt-2">
                {t("selectDateAndVehicle") || "Select your date and vehicle"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-main" />
                <h3 className="text-lg font-medium">
                  {t("chooseDate") || "Choose Date"}
                </h3>
              </div>

              <div className="border rounded-md p-2 bg-white shadow-sm">
                <Calendar
                  mode="single"
                  selected={selectedDateTime.date}
                  onSelect={(date) =>
                    setSelectedDateTime((prev) => ({
                      ...prev,
                      date: date || new Date(),
                    }))
                  }
                  className="rounded-md"
                  disabled={{ before: new Date() }}
                  locale={localeMap[locale]}
                />
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Clock className="h-5 w-5 text-main" />
                <h3 className="text-lg font-medium">
                  {t("selectTime") || "Select Time"}
                </h3>
              </div>

              <TimePicker
                value={selectedDateTime.time}
                onChange={(time) =>
                  setSelectedDateTime((prev) => ({
                    ...prev,
                    time: time,
                  }))
                }
                placeholder={t("selectTime") || "Select Time"}
              />

              <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
                <p className="text-sm">
                  {t("selectedDate") || "Selected Date"}:{" "}
                  <span className="font-medium">
                    {selectedDateTime.date?.toLocaleDateString()}{" "}
                    {selectedDateTime.time?.toLocaleTimeString()}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-main" />
                <h3 className="text-lg font-medium">
                  {t("chooseVehicle") || "Choose Vehicle"}
                </h3>
              </div>

              <Select
                onValueChange={setSelectedVehicleId}
                value={selectedVehicleId}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue
                    placeholder={t("chooseVehicle") || "Choose Vehicle"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicleTypes.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id!}>
                      <div className="flex justify-between w-full items-center">
                        <div className="flex items-center">
                          {renderVehicleIcon(vehicle.type)}
                          <span>{getVehicleTypeName(vehicle.type)}</span>
                          {renderPassengerIcons(vehicle.maxPersons)}
                        </div>
                        <span className="font-medium ml-2">
                          ₾{vehicle.price}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedVehicle && selectedDateTime.time && (
                <div className="mt-6 space-y-4">
                  <div className="rounded-md border overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b">
                      <p className="font-medium">
                        {t("bookingDetails") || "Booking Details"}
                      </p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("route") || "Route"}:
                        </span>
                        <span>
                          {startLocation} → {endLocation}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          {t("vehicle") || "Vehicle"}:
                        </span>
                        <div className="flex items-center">
                          {renderVehicleIcon(selectedVehicle.type)}
                          <span>
                            {getVehicleTypeName(selectedVehicle.type)}
                          </span>
                          {renderPassengerIcons(selectedVehicle.maxPersons)}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("date") || "Date"}:
                        </span>
                        <span>
                          {selectedDateTime.date?.toLocaleDateString()}{" "}
                          {selectedDateTime.time?.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("capacity") || "Capacity"}:
                        </span>
                        <span>
                          {passengerCapacity} {t("passengers") || "passengers"}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>{t("total") || "Total"}:</span>
                        <span>₾{currentPrice}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full py-3 h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600 transition-all hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                    onClick={handlePayment}
                    disabled={!currentPrice || !selectedDateTime.time}
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    {t("pay") || "Pay"} ₾{currentPrice}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <TransferPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handlePaymentModalClose}
        bookingData={getBookingData()}
      />
    </div>
  );
}
