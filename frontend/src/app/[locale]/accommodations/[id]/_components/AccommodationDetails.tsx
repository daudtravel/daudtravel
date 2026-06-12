"use client";

import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Users,
  BedDouble,
  Bath,
  Building2,
  Home,
  Phone,
  ChevronLeft,
  Wifi,
  Car,
  Waves,
  Coffee,
  Snowflake,
  CookingPot,
  Tv,
  WashingMachine,
  Thermometer,
  Dumbbell,
  PawPrint,
  ArrowUpDown,
  Eye,
  TreePalm,
  Check,
} from "lucide-react";
import { Whatsapp } from "@/src/components/svg";
import { Button } from "@/src/components/ui/button";
import renderDescription from "@/src/components/textEditor/RenderText";
import { useAccommodationById } from "@/src/hooks/accommodations/useAccommodationById";
import { CONTACT } from "@/src/constants/accommodations.constants";
import TourLoader from "@/src/components/shared/loader/TourLoader";

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  wifi: Wifi,
  parking: Car,
  pool: Waves,
  breakfast: Coffee,
  ac: Snowflake,
  kitchen: CookingPot,
  tv: Tv,
  washingMachine: WashingMachine,
  heating: Thermometer,
  balcony: TreePalm,
  seaView: Eye,
  elevator: ArrowUpDown,
  petsAllowed: PawPrint,
  gym: Dumbbell,
};

export default function AccommodationDetails() {
  const t = useTranslations("accommodations");
  const params = useParams();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const id = params.id as string;

  const { data, isLoading } = useAccommodationById({ id, locale });
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) return <TourLoader />;

  const item = data?.data;
  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t("notFound")}</p>
      </div>
    );
  }

  const localization =
    item.localizations.find((loc) => loc.locale === locale) ||
    item.localizations[0];

  const isApartment = item.type === "APARTMENT";
  const TypeIcon = isApartment ? Home : Building2;

  const galleryImages = [
    item.mainImage,
    ...item.images.map((img) => img.url),
  ].filter(Boolean);

  const currentImage = galleryImages[activeImage] || item.mainImage;

  const pageUrl =
    typeof window !== "undefined" ? window.location.href : "";

  const whatsappMessage = encodeURIComponent(
    `${t("inquiryGreeting")} "${localization?.name}" (${item.city}) — ${item.price} ₾ / ${t("perNight")}.\n${pageUrl}`
  );
  const whatsappUrl = `https://wa.me/${CONTACT.WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  return (
    <main
      className="w-full min-h-screen md:px-20 px-4 pt-6 md:pt-20 pb-20"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full">
        <Link
          href={`/${locale}/accommodations`}
          className="inline-flex items-center gap-1 text-sm text-brand-green hover:underline mb-4"
        >
          <ChevronLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
          {t("backToList")}
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: gallery + details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <div className="space-y-3">
              <div className="relative w-full h-[260px] md:h-[420px] rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={`${process.env.NEXT_PUBLIC_BASE_URL}${currentImage}`}
                  fill
                  className="object-cover"
                  alt={localization?.name || "Accommodation"}
                  priority
                />
                <div
                  className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} flex items-center gap-1.5 bg-brand-green text-white text-xs font-medium px-3 py-1.5 rounded-full`}
                >
                  <TypeIcon className="w-4 h-4" />
                  {isApartment ? t("apartment") : t("hotel")}
                </div>
              </div>

              {galleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {galleryImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`relative w-20 h-16 md:w-24 md:h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                        i === activeImage
                          ? "border-brand-green"
                          : "border-transparent"
                      }`}
                    >
                      <Image
                        src={`${process.env.NEXT_PUBLIC_BASE_URL}${img}`}
                        fill
                        className="object-cover"
                        alt={`${localization?.name} ${i + 1}`}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title + location */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-brand-green">
                {localization?.name}
              </h1>
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <MapPin className="w-4 h-4 text-brand-green" />
                <span className="text-sm">
                  {[item.city, localization?.address]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            </div>

            {/* Capacity */}
            <div className="flex flex-wrap gap-4 md:gap-6 border-y border-brand-green-100 py-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-green" />
                <span className="text-sm">
                  {item.maxGuests} {t("guests")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-brand-green" />
                <span className="text-sm">
                  {item.bedrooms} {t("bedrooms")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="w-5 h-5 text-brand-green" />
                <span className="text-sm">
                  {item.bathrooms} {t("bathrooms")}
                </span>
              </div>
            </div>

            {/* Description */}
            {localization?.description && (
              <div>
                <h2 className="text-lg font-semibold text-brand-green mb-3">
                  {t("description")}
                </h2>
                {renderDescription(localization.description)}
              </div>
            )}

            {/* Amenities */}
            {item.amenities.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-brand-green mb-3">
                  {t("amenities")}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {item.amenities.map((key) => {
                    const Icon = AMENITY_ICONS[key] || Check;
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <Icon className="w-4 h-4 text-brand-green shrink-0" />
                        {t(`amenityLabels.${key}`)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: sticky contact card */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 bg-white border border-brand-green-100 rounded-xl shadow-sm p-6 space-y-4">
              <div>
                <span className="text-2xl font-bold text-brand-green">
                  {item.price} ₾
                </span>
                <span className="text-sm text-gray-500"> / {t("perNight")}</span>
              </div>

              <p className="text-sm text-gray-600">{t("contactPrompt")}</p>

              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full gap-2 bg-[#25D366] hover:bg-[#1fb855] text-white">
                  <Whatsapp className="w-5 h-5 fill-white" />
                  {t("contactWhatsapp")}
                </Button>
              </a>

              <a href={`tel:${CONTACT.PHONE}`}>
                <Button variant="outline" className="w-full gap-2">
                  <Phone className="w-4 h-4" />
                  {t("callUs")}
                </Button>
              </a>

              <p className="text-xs text-gray-400 text-center">
                {t("availabilityNote")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
