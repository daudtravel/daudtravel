import { useTranslations, useLocale } from "next-intl";
import {
  User,
  Users,
  Wallet,
  CalendarDays,
  Calendar1,
  PersonStanding,
  TextIcon,
  MapPin,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { Tour } from "@/src/types/tours.type";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/src/components/ui/button";

const LocationPin = ({ location }: { location: string }) => (
  <div className="flex flex-col items-center relative">
    <MapPin className="w-5 h-5 text-main" />
    <div className="h-10 text-center mt-2 w-20">
      <span className="text-xs font-medium block overflow-hidden text-ellipsis text-center">
        {location}
      </span>
    </div>
  </div>
);

export const TourCard = ({ tour }: { tour: Tour }) => {
  const t = useTranslations("tours");
  const currentLocale = useLocale();
  const isRTL = currentLocale === "ar";
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const localization = tour.localizations[0];
  const isIndividual = tour.type === "INDIVIDUAL";

  const isCurrentSeasonSummer = () => {
    const month = new Date().getMonth();
    return month >= 5 && month <= 8;
  };

  const processLocations = () => {
    let locations = [
      localization?.startLocation,
      ...(localization?.locations || []),
    ].filter(Boolean);

    if (isRTL) locations = locations.reverse();

    if (locations.length > 4) {
      return {
        display: [locations[0], locations[locations.length - 1]],
        hasMore: true,
        moreCount: locations.length - 2,
      };
    }

    return { display: locations, hasMore: false, moreCount: 0 };
  };

  const { display, hasMore, moreCount } = processLocations();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const renderPrice = () => {
    if (isIndividual && tour.individualPricing) {
      const isSummer = isCurrentSeasonSummer();
      const totalPrice = isSummer
        ? tour.individualPricing.seasonTotalPrice
        : tour.individualPricing.offSeasonTotalPrice;
      const discountedPrice = isSummer
        ? tour.individualPricing.seasonDiscountedPrice
        : tour.individualPricing.offSeasonDiscountedPrice;

      return (
        <>
          <span
            className={
              discountedPrice ? "text-sm line-through text-gray-500" : "text-sm"
            }
          >
            {totalPrice || 0} ₾
          </span>
          {discountedPrice && (
            <span className="text-sm font-medium text-red-600">
              {discountedPrice} ₾
            </span>
          )}
        </>
      );
    }

    if (tour.groupPricing) {
      return (
        <>
          <span
            className={
              tour.groupPricing.discountedPrice
                ? "text-sm line-through text-gray-500"
                : "text-sm"
            }
          >
            {tour.groupPricing.totalPrice || 0} $
          </span>
          {tour.groupPricing.discountedPrice && (
            <span className="text-sm font-medium text-red-600">
              {tour.groupPricing.discountedPrice} ₾
            </span>
          )}
        </>
      );
    }

    return <span className="text-sm">0 ₾</span>;
  };

  return (
    <div className="flex flex-col w-full bg-[#f2f5ff] border border-gray-300 rounded-xl shadow-xs overflow-hidden transition-all duration-300 hover:shadow-lg h-full">
      <Link className="w-full h-full flex flex-col" href={`/tours/${tour.id}`}>
        {/* Image Section */}
        <div className="relative w-full h-[200px] md:h-[230px] flex-shrink-0">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          <div
            className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} z-10`}
          >
            {isIndividual ? (
              <User className="w-6 h-6 text-white bg-main rounded-full p-1" />
            ) : (
              <Users className="w-6 h-6 text-white bg-main rounded-full p-1" />
            )}
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
          />
          {imageError && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div
          className="w-full py-4 px-4 flex flex-col gap-4 flex-grow"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Tour Name */}
          <div className="flex items-center gap-2">
            <TextIcon className="w-4 h-4 text-main" />
            <span className="text-sm line-clamp-1">{localization?.name}</span>
          </div>

          {/* Start Location & Duration */}
          <div className="flex md:items-center gap-3 md:gap-0 flex-col md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-main" />
              <span className="text-sm font-bold">{t("startLocation")}:</span>
              <span className="text-sm line-clamp-1">
                {localization?.startLocation}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar1 className="w-4 h-4 text-main" />
              <span className="text-sm">
                {tour.days} {t("day")}
              </span>
              {tour.nights > 0 && (
                <span className="text-sm">
                  / {tour.nights} {t("night")}
                </span>
              )}
            </div>
          </div>

          {/* Persons & Price */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-0 md:items-center md:justify-between">
            {isIndividual && tour.maxPersons && (
              <div className="flex items-center gap-2">
                <PersonStanding className="w-4 h-4 text-main" />
                <span className="text-sm font-bold">{t("numOfPersons")}:</span>
                <span className="text-sm">{tour.maxPersons}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-main" />
              <span className="text-sm font-bold">{t("price")}: </span>
              {renderPrice()}
            </div>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-main" />
            <span className="text-sm font-bold">{t("startDate")}:</span>
            <span className="text-sm">
              {isIndividual || !tour.startDate
                ? t("agreement")
                : new Date(tour.startDate).toLocaleDateString(
                    isRTL ? "ar" : "en-CA"
                  )}
            </span>
          </div>

          {/* Tour Type */}
          <div className="flex items-center gap-2">
            {isIndividual ? (
              <User className="w-4 h-4 text-main" />
            ) : (
              <Users className="w-4 h-4 text-main" />
            )}
            <span className="text-sm font-bold">{t("tourType")}:</span>
            <span className="text-sm">
              {isIndividual ? t("individualTourType") : t("groupTourType")}
            </span>
          </div>

          {/* Locations Route */}
          {localization?.locations && localization.locations.length > 0 && (
            <div className="relative py-4 min-h-[80px]">
              <div className="absolute left-0 right-0 top-1/3 h-1 bg-white border-gray-300 border rounded-lg transform -translate-y-1/2" />
              <div
                className={`flex justify-between items-center relative ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <LocationPin location={display[0]} />
                {hasMore && (
                  <div className="flex flex-col items-center relative px-2">
                    <MoreHorizontal className="w-5 h-5 text-main z-10" />
                    <span className="text-xs font-medium text-gray-500 text-center mt-2">
                      +{moreCount} {t("stops")}
                    </span>
                  </div>
                )}
                {!hasMore &&
                  display.length > 2 &&
                  display
                    .slice(1, -1)
                    .map((loc, i) => <LocationPin key={i} location={loc} />)}
                <LocationPin location={display[display.length - 1]} />
              </div>
            </div>
          )}

          <div className="flex-grow" />

          {/* View Details Button */}
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
