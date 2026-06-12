"use client";

import renderDescription from "@/src/components/textEditor/RenderText";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  CalendarDays,
  ChevronRight,
  GroupIcon,
  MapPin,
  PersonStanding,
  Timer,
  Wallet,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import React, { useMemo } from "react";
import { cn } from "@/src/utlis/cn";
import {
  TourType,
  IndividualPricing,
  GroupPricing,
} from "@/src/types/tours.type";

interface DescriptionProps {
  data: {
    name?: string;
    description?: string;
    startLocation?: string;
    endLocation?: string;
    locations: string[];
    allDestinations: string[];
    days: number;
    nights: number;
    maxPersons?: number;
    type: TourType;
    isDaily: boolean;
    startDate?: Date;
    individualPricing?: IndividualPricing;
    groupPricing?: GroupPricing;
  };
}

const Description = React.memo<DescriptionProps>(({ data }) => {
  const t = useTranslations("tours");
  const currentLocale = useLocale();
  const isRTL = currentLocale === "ar";

  const isCurrentSeasonSummer = () => {
    const currentMonth = new Date().getMonth();
    return currentMonth >= 5 && currentMonth <= 8;
  };

  const isIndividual = data.type === "INDIVIDUAL";

  const priceInfo = useMemo(() => {
    if (isIndividual && data.individualPricing) {
      const isSummer = isCurrentSeasonSummer();
      const totalPrice = isSummer
        ? data.individualPricing.seasonTotalPrice
        : data.individualPricing.offSeasonTotalPrice;
      const discountedPrice = isSummer
        ? data.individualPricing.seasonDiscountedPrice
        : data.individualPricing.offSeasonDiscountedPrice;

      return {
        originalPrice: totalPrice || 0,
        discountedPrice,
        hasDiscount: !!discountedPrice,
      };
    }

    if (data.groupPricing) {
      return {
        originalPrice: data.groupPricing.totalPrice || 0,
        discountedPrice: data.groupPricing.discountedPrice,
        hasDiscount: !!data.groupPricing.discountedPrice,
      };
    }

    return {
      originalPrice: 0,
      discountedPrice: undefined,
      hasDiscount: false,
    };
  }, [isIndividual, data.individualPricing, data.groupPricing]);

  const formattedDate = useMemo(() => {
    if (isIndividual) return t("agreement");
    if (data.isDaily) return t("everyDay");
    if (!data.startDate) return t("agreement");

    const localeMap: Record<string, string> = {
      ka: "ka-GE",
      ar: "ar-SA",
      ru: "ru-RU",
      tr: "tr-TR",
      en: "en-CA",
    };

    try {
      return new Date(data.startDate).toLocaleDateString(
        localeMap[currentLocale] || "en-CA"
      );
    } catch {
      return "Invalid Date";
    }
  }, [isIndividual, data.isDaily, data.startDate, currentLocale, t]);

  const displayDestinations = isRTL
    ? [...data.allDestinations].reverse()
    : data.allDestinations;

  const InfoItem = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
    value: string | React.ReactNode;
  }) => (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-brand-green-50 border border-brand-green-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-brand-green" />
      </div>
      <div className="min-w-0">
        <span className="block text-xs text-gray-500">{label}</span>
        <span className="block text-sm font-medium text-gray-900">{value}</span>
      </div>
    </div>
  );

  return (
    <Card className="w-full" dir={isRTL ? "rtl" : "ltr"}>
      <CardContent className="p-4 md:p-6 flex flex-col gap-4 h-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoItem
            icon={GroupIcon}
            label={t("tourType")}
            value={isIndividual ? t("individualTourType") : t("groupTourType")}
          />

          {data.startLocation && (
            <InfoItem
              icon={MapPin}
              label={t("startLocation")}
              value={<span className="line-clamp-1">{data.startLocation}</span>}
            />
          )}

          <InfoItem
            icon={CalendarDays}
            label={t("startDate")}
            value={formattedDate}
          />

          <InfoItem
            icon={Wallet}
            label={t("price")}
            value={
              <div className="flex items-center gap-2">
                {priceInfo.hasDiscount && priceInfo.discountedPrice ? (
                  <>
                    <span className="font-semibold text-red-600">
                      {priceInfo.discountedPrice} ₾
                    </span>
                    <span className="line-through text-gray-400 text-xs">
                      {priceInfo.originalPrice} ₾
                    </span>
                  </>
                ) : (
                  <span className="font-semibold text-brand-green">
                    {priceInfo.originalPrice} ₾
                  </span>
                )}
              </div>
            }
          />

          {data.maxPersons && (
            <InfoItem
              icon={PersonStanding}
              label={t("numOfPersons")}
              value={data.maxPersons.toString()}
            />
          )}

          <InfoItem
            icon={Timer}
            label={t("duration")}
            value={
              <>
                {data.days} {t("day")}
                {data.nights > 0 && (
                  <>
                    {" "}
                    / {data.nights} {t("night")}
                  </>
                )}
              </>
            }
          />
        </div>

        {data.allDestinations.length > 0 && (
          <div className="p-3 bg-brand-green-50 border border-brand-green-100 rounded-lg">
            <h2 className="font-semibold mb-2 text-sm text-brand-green">
              {t("tourDestinations")}
            </h2>
            <div
              className={cn(
                "flex flex-wrap items-center gap-y-2",
                isRTL && "flex-row-reverse"
              )}
            >
              {displayDestinations.map((location, index, array) => (
                <div key={`destination-${index}`} className="flex items-center">
                  <span className="text-sm bg-white px-2.5 py-1 rounded-full border border-brand-green-100 text-gray-800 shadow-sm">
                    {location}
                  </span>
                  {index < array.length - 1 && (
                    <ChevronRight
                      className={cn(
                        "mx-1.5 w-4 h-4 flex-shrink-0 text-brand-green",
                        isRTL && "rotate-180"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.description && (
          <div
            className={cn(
              "text-gray-600 text-sm flex-grow",
              isRTL && "text-right"
            )}
          >
            {renderDescription(data.description)}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

Description.displayName = "Description";

export default Description;
