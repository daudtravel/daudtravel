"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { useTransferById } from "@/src/hooks/transfers/useTransfersById";
import { BookingPanel, BookingData } from "../../_components/booking/BookingPanel";
import PaymentModal from "../../_components/booking/PaymentModal";
import { VehicleType } from "@/src/types/transfers.types";

export default function TransferDetailsClient() {
  const t = useTranslations("transfers");
  const locale = useLocale();
  const params = useParams();
  const transferId = params.id as string;

  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: response, isLoading, isError } = useTransferById(transferId, locale);
  const transfer = response?.data;
  const localization = transfer?.localizations?.[0];
  const startLocation = localization?.startLocation || "—";
  const endLocation = localization?.endLocation || "—";
  const vehicles = (transfer?.vehicleTypes || []).map((v) => ({
    id: v.id!,
    type: v.type as VehicleType,
    price: v.price,
    maxPersons: v.maxPersons,
  }));

  const handleBook = (data: BookingData) => {
    setBookingData(data);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-mid" />
        <p className="text-sm text-gray-500">{t("loading") || "Loading…"}</p>
      </div>
    );
  }

  if (isError || !transfer) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <div className="inline-flex p-3 bg-red-50 rounded-full mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-red-600 font-medium">{t("errorLoadingTransfer")}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="w-full px-4 md:px-20 py-8">
        <BookingPanel
          transferId={transferId}
          startLocation={startLocation}
          endLocation={endLocation}
          vehicles={vehicles}
          onBook={handleBook}
        />
      </div>

      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        bookingData={bookingData}
      />
    </main>
  );
}
