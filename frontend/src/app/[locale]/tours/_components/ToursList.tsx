"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Filter } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import ToursSectionLoader from "@/src/components/shared/loader/ToursSectionLoader";
import {
  Tour,
  TourFilters,
  ToursQueryParams,
  TourType,
} from "@/src/types/tours.type";
import { TOURS_CONFIG } from "@/src/constants/tours.constants";
import ToursFilters from "./ToursFilters";
import { TourCard } from "./TourCard";
import ToursPagination from "./ToursPagination";
import { useTours } from "@/src/hooks/tours/useTours";
import { useTourFilterOptions } from "@/src/hooks/tours/useTourFilterOptions";

const isValidTourType = (value: string | undefined): value is TourType => {
  if (!value) return false;
  return value === "GROUP" || value === "INDIVIDUAL";
};

export default function ToursList() {
  const t = useTranslations("tours");
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;

  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const locationFilter = searchParams.get("startLocation") || undefined;
  const typeFilter = searchParams.get("type") || undefined;

  const validatedTypeFilter =
    typeFilter && isValidTourType(typeFilter) ? typeFilter : undefined;

  const [showFilters, setShowFilters] = useState(false);
  const [queryParams, setQueryParams] = useState<ToursQueryParams>({
    locale,
    startLocation: locationFilter,
    type: validatedTypeFilter,
    page: currentPage,
    limit: TOURS_CONFIG.ITEMS_PER_PAGE,
  });

  useEffect(() => {
    const validatedType =
      typeFilter && isValidTourType(typeFilter) ? typeFilter : undefined;

    setQueryParams((prev) => ({
      ...prev,
      startLocation: locationFilter,
      type: validatedType,
      page: currentPage,
    }));
  }, [locationFilter, typeFilter, currentPage]);

  const { data: toursData, isLoading: isLoadingTours } = useTours(queryParams);

  const { data: filterOptionsData, isLoading: isLoadingFilters } =
    useTourFilterOptions(locale);

  const buildToursUrl = (filters: TourFilters, page: number = 1): string => {
    const params = new URLSearchParams();

    if (filters.startLocation) {
      params.set("startLocation", filters.startLocation);
    }
    if (filters.type) {
      params.set("type", filters.type);
    }
    params.set("page", String(page));

    const query = params.toString();
    return `/${locale}/tours${query ? `?${query}` : ""}`;
  };

  const handleApplyFilters = (filters: TourFilters) => {
    setQueryParams((prev) => ({
      ...prev,
      startLocation: filters.startLocation,
      type: filters.type,
      page: 1,
    }));
    router.push(buildToursUrl(filters, 1));
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setQueryParams({
      locale,
      startLocation: undefined,
      type: undefined,
      page: 1,
      limit: TOURS_CONFIG.ITEMS_PER_PAGE,
    });
    router.push(`/${locale}/tours?page=1`);
    setShowFilters(false);
  };

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
    router.push(
      buildToursUrl(
        {
          startLocation: queryParams.startLocation,
          type: queryParams.type,
        },
        page
      )
    );
  };

  const toggleFilters = () => setShowFilters((prev) => !prev);

  const hasResults = toursData?.data && toursData.data.length > 0;

  return (
    <main className="w-full min-h-screen md:px-20 xl:pr-36 px-4 pt-6 md:pt-20 pb-20">
      <div className="md:hidden mb-4">
        <Button
          onClick={toggleFilters}
          className="w-full flex items-center justify-center gap-2 h-8"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? t("hideFilter") : t("showFilter")}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between w-full gap-10 md:gap-5 xl:gap-16">
        <aside
          className={`w-full lg:w-[500px] xl:w-[550px] ${
            showFilters ? "block" : "hidden md:block"
          }`}
        >
          <ToursFilters
            initialStartLocation={locationFilter}
            initialType={validatedTypeFilter}
            filterOptionsData={filterOptionsData}
            isLoading={isLoadingFilters}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
          />
        </aside>

        {isLoadingTours ? (
          <ToursSectionLoader />
        ) : (
          <div className="w-full">
            <div
              className={`w-full grid lg:grid-cols-2 gap-10 md:gap-5 xl:gap-12 ${
                showFilters ? "hidden md:grid" : "grid"
              }`}
            >
              {hasResults ? (
                toursData.data.map((tour: Tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))
              ) : (
                <div className="text-center col-span-2 py-10">
                  <p className="text-gray-600">{t("noToursFound")}</p>
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    className="mt-4"
                  >
                    {t("resetFilters")}
                  </Button>
                </div>
              )}
            </div>

            {toursData?.meta && hasResults && (
              <ToursPagination
                currentPage={queryParams.page || 1}
                totalPages={toursData.meta.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
