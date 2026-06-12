import { useTranslations, useLocale } from "next-intl";
import {
  User,
  Users,
  CalendarDays,
  Clock,
  PersonStanding,
  MapPin,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Link } from "@/src/i18n/routing";
import { Tour } from "@/src/types/tours.type";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/src/components/ui/button";

const MAX_ROUTE_CHIPS = 3;

export const TourCard = ({ tour }: { tour: Tour }) => {
  const t = useTranslations("tours");
  const currentLocale = useLocale();
  const isRTL = currentLocale === "ar";
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Find the localization matching current locale, fallback to first one
  const localization =
    tour.localizations.find((loc) => loc.locale === currentLocale) ||
    tour.localizations[0];

  const isIndividual = tour.type === "INDIVIDUAL";

  const isCurrentSeasonSummer = () => {
    const month = new Date().getMonth();
    return month >= 5 && month <= 8;
  };

  const allStops = [
    localization?.startLocation,
    ...(localization?.locations || []),
  ].filter(Boolean);

  // First stops + last one, collapsed in the middle when too long
  const routeChips =
    allStops.length > MAX_ROUTE_CHIPS + 1
      ? {
          visible: allStops.slice(0, MAX_ROUTE_CHIPS - 1),
          last: allStops[allStops.length - 1],
          hiddenCount: allStops.length - MAX_ROUTE_CHIPS,
        }
      : { visible: allStops, last: null, hiddenCount: 0 };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;
  const TypeIcon = isIndividual ? User : Users;

  const getPriceInfo = () => {
    if (isIndividual && tour.individualPricing) {
      const isSummer = isCurrentSeasonSummer();
      return {
        total: isSummer
          ? tour.individualPricing.seasonTotalPrice
          : tour.individualPricing.offSeasonTotalPrice,
        discounted: isSummer
          ? tour.individualPricing.seasonDiscountedPrice
          : tour.individualPricing.offSeasonDiscountedPrice,
      };
    }
    if (tour.groupPricing) {
      return {
        total: tour.groupPricing.totalPrice,
        discounted: tour.groupPricing.discountedPrice,
      };
    }
    return { total: 0, discounted: undefined };
  };

  const priceInfo = getPriceInfo();
  const hasDiscount = !!priceInfo.discounted;

  return (
    <div
      className="group/card w-full bg-white border border-brand-green-100 rounded-2xl shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-xl h-full"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Link
        className="flex flex-col sm:flex-row w-full h-full"
        href={`/tours/${tour.id}`}
      >
        {/* ─── Image side (slightly wider than half) ─── */}
        <div className="relative w-full sm:w-[55%] h-[210px] sm:h-auto sm:min-h-[280px] md:min-h-[300px] flex-shrink-0 overflow-hidden">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}

          {/* Tour type badge */}
          <div
            className={`absolute top-3 ${isRTL ? "right-3" : "left-3"} z-10 flex items-center gap-1.5 bg-brand-green/90 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm`}
          >
            <TypeIcon className="w-3.5 h-3.5" />
            {isIndividual ? t("individualTourType") : t("groupTourType")}
          </div>

          {/* Duration badge */}
          <div
            className={`absolute bottom-3 ${isRTL ? "right-3" : "left-3"} z-10 flex items-center gap-1.5 bg-black/55 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full`}
          >
            <Clock className="w-3.5 h-3.5" />
            {tour.days} {t("day")}
            {tour.nights > 0 && ` / ${tour.nights} ${t("night")}`}
          </div>

          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_URL}${tour.mainImage}`}
            fill
            className={`object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            alt={localization?.name || "Tour"}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            priority={false}
            loading="lazy"
            sizes="(max-width: 640px) 100vw, 45vw"
          />
          {imageError && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* ─── Content side ─── */}
        <div className="flex-1 flex flex-col gap-3 p-4 md:p-5 min-w-0">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 line-clamp-2 group-hover/card:text-brand-green transition-colors">
            {localization?.name}
          </h3>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-brand-green shrink-0" />
              <span className="text-sm text-gray-500 shrink-0">
                {t("startLocation")}:
              </span>
              <span className="text-sm text-gray-800 truncate">
                {localization?.startLocation}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-brand-green shrink-0" />
              <span className="text-sm text-gray-500">{t("startDate")}:</span>
              <span className="text-sm text-gray-800">
                {isIndividual || !tour.startDate
                  ? t("agreement")
                  : new Date(tour.startDate).toLocaleDateString(
                      isRTL ? "ar" : "en-CA"
                    )}
              </span>
            </div>

            {isIndividual && tour.maxPersons && (
              <div className="flex items-center gap-2">
                <PersonStanding className="w-4 h-4 text-brand-green shrink-0" />
                <span className="text-sm text-gray-500">
                  {t("numOfPersons")}:
                </span>
                <span className="text-sm text-gray-800">{tour.maxPersons}</span>
              </div>
            )}
          </div>

          {/* Route chips */}
          {allStops.length > 1 && (
            <div className="flex flex-wrap items-center gap-y-1.5">
              {routeChips.visible.map((stop, i, arr) => (
                <span key={`stop-${i}`} className="flex items-center">
                  <span className="text-xs bg-brand-green-50 border border-brand-green-100 text-gray-800 px-2 py-0.5 rounded-full">
                    {stop}
                  </span>
                  {(i < arr.length - 1 || routeChips.last) && (
                    <ChevronIcon className="w-3.5 h-3.5 text-brand-green mx-0.5 shrink-0" />
                  )}
                </span>
              ))}
              {routeChips.last && (
                <span className="flex items-center">
                  <span className="text-xs text-gray-500 px-1">
                    +{routeChips.hiddenCount} {t("stops")}
                  </span>
                  <ChevronIcon className="w-3.5 h-3.5 text-brand-green mx-0.5 shrink-0" />
                  <span className="text-xs bg-brand-green-50 border border-brand-green-100 text-gray-800 px-2 py-0.5 rounded-full">
                    {routeChips.last}
                  </span>
                </span>
              )}
            </div>
          )}

          <div className="flex-grow" />

          {/* Price + CTA */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-3 gap-3">
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-gray-500">{t("price")}</span>
              <div className="flex items-baseline gap-2">
                {hasDiscount ? (
                  <>
                    <span className="text-lg md:text-xl font-bold text-red-600 whitespace-nowrap">
                      {priceInfo.discounted} ₾
                    </span>
                    <span className="text-sm line-through text-gray-400 whitespace-nowrap">
                      {priceInfo.total || 0} ₾
                    </span>
                  </>
                ) : (
                  <span className="text-lg md:text-xl font-bold text-brand-green whitespace-nowrap">
                    {priceInfo.total || 0} ₾
                  </span>
                )}
              </div>
            </div>

            <Button className="h-9 px-4 group/btn shrink-0" tabIndex={-1}>
              {isRTL && (
                <ArrowIcon className="mr-2 w-4 h-4 group-hover/btn:-translate-x-1 transition-transform" />
              )}
              {t("viewDetails")}
              {!isRTL && (
                <ArrowIcon className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              )}
            </Button>
          </div>
        </div>
      </Link>
    </div>
  );
};
