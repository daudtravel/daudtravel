import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/src/components/ui/select";
import { Button } from "@/src/components/ui/button";
import FilterSectionLoader from "@/src/components/shared/loader/FilterSectionLoader";
import { Tour, TourType } from "@/src/types/tours.type";

interface TourFilters {
  startLocation?: string;
  type?: TourType;
}

interface ToursFiltersProps {
  initialStartLocation?: string;
  initialType?: TourType;
  filterOptionsData?: { data: Tour[] };
  isLoading: boolean;
  onApplyFilters: (filters: TourFilters) => void;
  onResetFilters: () => void;
}

const ALL_OPTION = "all";

const TOUR_TYPE_OPTIONS = {
  [ALL_OPTION]: "allTourTypes",
  GROUP: "groupTourType",
  INDIVIDUAL: "individualTourType",
} as const;

export default function ToursFilters({
  initialStartLocation,
  initialType,
  filterOptionsData,
  isLoading,
  onApplyFilters,
  onResetFilters,
}: ToursFiltersProps) {
  const t = useTranslations("tours");
  const currentLocale = useLocale();
  const isRTL = currentLocale === "ar";

  const [selectedLocation, setSelectedLocation] = useState(
    initialStartLocation || ALL_OPTION
  );
  const [selectedType, setSelectedType] = useState<string>(
    initialType || ALL_OPTION
  );

  const availableLocations = getUniqueLocations(filterOptionsData?.data || []);

  useEffect(() => {
    setSelectedLocation(initialStartLocation || ALL_OPTION);
    setSelectedType(initialType || ALL_OPTION);
  }, [initialStartLocation, initialType]);

  const handleApply = () => {
    const filters: TourFilters = {};

    if (selectedLocation !== ALL_OPTION) {
      filters.startLocation = selectedLocation;
    }
    if (selectedType !== ALL_OPTION) {
      filters.type = selectedType as TourType;
    }

    onApplyFilters(filters);
  };

  const handleReset = () => {
    setSelectedLocation(ALL_OPTION);
    setSelectedType(ALL_OPTION);
    onResetFilters();
  };

  if (isLoading) {
    return <FilterSectionLoader />;
  }

  return (
    <div
      className="bg-[#f2f5ff] border border-gray-300 rounded-xl shadow-xs p-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl flex items-center text-main font-semibold">
          <Filter className={`${isRTL ? "ml-2" : "mr-2"} w-5 h-5 text-main`} />
          {t("filter")}
        </h3>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg p-4 space-y-4">
          <div>
            <label htmlFor="location-filter" className="block mb-2">
              {t("startLocation")}
            </label>
            <Select
              value={selectedLocation}
              onValueChange={setSelectedLocation}
            >
              <SelectTrigger id="location-filter" className="bg-white">
                <SelectValue>
                  {selectedLocation === ALL_OPTION
                    ? t("allLocations")
                    : selectedLocation}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_OPTION}>{t("allLocations")}</SelectItem>
                {availableLocations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="type-filter" className="block mb-2">
              {t("tourType")}
            </label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger id="type-filter" className="bg-white">
                <SelectValue>
                  {t(
                    TOUR_TYPE_OPTIONS[
                      selectedType as keyof typeof TOUR_TYPE_OPTIONS
                    ]
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TOUR_TYPE_OPTIONS).map(([value, labelKey]) => (
                  <SelectItem key={value} value={value}>
                    {t(labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          className={`flex ${isRTL ? "space-x-reverse space-x-2" : "space-x-2"}`}
        >
          <Button onClick={handleApply} className="w-full h-8">
            {t("search")}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="icon"
            className="hover:bg-red-50 h-8"
            aria-label={t("resetFilters")}
          >
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function getUniqueLocations(tours: Tour[]): string[] {
  const locationsSet = new Set<string>();

  tours.forEach((tour) => {
    tour.localizations.forEach((localization) => {
      if (localization.startLocation) {
        locationsSet.add(localization.startLocation);
      }
    });
  });

  return Array.from(locationsSet).sort();
}
