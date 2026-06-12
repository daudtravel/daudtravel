import { useTranslations, useLocale } from "next-intl";
import {
  MapPin,
  Users,
  BedDouble,
  Bath,
  Wallet,
  Building2,
  Home,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { Link } from "@/src/i18n/routing";
import Image from "next/image";
import { useState } from "react";
import { Accommodation } from "@/src/types/accommodations.type";
import { Button } from "@/src/components/ui/button";

export const AccommodationCard = ({ item }: { item: Accommodation }) => {
  const t = useTranslations("accommodations");
  const currentLocale = useLocale();
  const isRTL = currentLocale === "ar";
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const localization =
    item.localizations.find((loc) => loc.locale === currentLocale) ||
    item.localizations[0];

  const isApartment = item.type === "APARTMENT";
  const TypeIcon = isApartment ? Home : Building2;
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="flex flex-col w-full bg-white border border-brand-green-100 rounded-xl shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-xl h-full">
      <Link
        className="w-full h-full flex flex-col"
        href={`/accommodations/${item.id}`}
      >
        <div className="relative w-full h-[200px] md:h-[230px] flex-shrink-0">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          <div
            className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} z-10 flex items-center gap-1.5 bg-brand-green text-white text-xs font-medium px-2.5 py-1 rounded-full`}
          >
            <TypeIcon className="w-3.5 h-3.5" />
            {isApartment ? t("apartment") : t("hotel")}
          </div>
          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_URL}${item.mainImage}`}
            fill
            className={`object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            alt={localization?.name || "Accommodation"}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            priority={false}
            loading="lazy"
          />
          {imageError && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        <div
          className="w-full py-4 px-4 flex flex-col gap-3 flex-grow"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <h2 className="text-base font-semibold line-clamp-1 text-brand-green">
            {localization?.name}
          </h2>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-green shrink-0" />
            <span className="text-sm text-gray-600 line-clamp-1">
              {item.city}
            </span>
          </div>

          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-brand-green" />
              <span className="text-sm">{item.maxGuests}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 text-brand-green" />
              <span className="text-sm">{item.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-brand-green" />
              <span className="text-sm">{item.bathrooms}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-brand-green shrink-0" />
            <span className="text-sm font-semibold text-brand-green">
              {item.price} ₾
            </span>
            <span className="text-xs text-gray-500">/ {t("perNight")}</span>
          </div>

          <div className="flex-grow" />

          <Button className="w-full h-8 group mt-auto">
            {isRTL && (
              <ArrowIcon className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            )}
            {t("viewDetails")}
            {!isRTL && (
              <ArrowIcon className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            )}
          </Button>
        </div>
      </Link>
    </div>
  );
};

export default AccommodationCard;
