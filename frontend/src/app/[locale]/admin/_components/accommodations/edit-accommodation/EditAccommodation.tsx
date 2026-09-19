"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import AccommodationForm from "../AccommodationForm";
import { useAccommodationById } from "@/src/hooks/accommodations/useAccommodationById";

export default function EditAccommodation({ id }: { id: string }) {
  const t = useTranslations("admin");

  const { data, isLoading } = useAccommodationById({ id, allLocales: true });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-500">{t("accommodations.listingNotFound")}</p>
      </div>
    );
  }

  return <AccommodationForm accommodation={data.data} />;
}
