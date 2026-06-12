"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Building2, Home, LayoutGrid } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import ToursSectionLoader from "@/src/components/shared/loader/ToursSectionLoader";
import ToursPagination from "@/src/app/[locale]/tours/_components/ToursPagination";
import {
  Accommodation,
  AccommodationsQueryParams,
  AccommodationType,
} from "@/src/types/accommodations.type";
import { ACCOMMODATIONS_CONFIG } from "@/src/constants/accommodations.constants";
import { useAccommodations } from "@/src/hooks/accommodations/useAccommodations";
import { AccommodationCard } from "./AccommodationCard";

const isValidType = (
  value: string | undefined
): value is AccommodationType => {
  return value === "HOTEL" || value === "APARTMENT";
};

export default function AccommodationsList() {
  const t = useTranslations("accommodations");
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;

  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const typeFilter = searchParams.get("type") || undefined;
  const searchFilter = searchParams.get("search") || "";

  const validatedType = isValidType(typeFilter) ? typeFilter : undefined;

  const [searchInput, setSearchInput] = useState(searchFilter);
  const [queryParams, setQueryParams] = useState<AccommodationsQueryParams>({
    locale,
    type: validatedType,
    search: searchFilter || undefined,
    page: currentPage,
    limit: ACCOMMODATIONS_CONFIG.ITEMS_PER_PAGE,
  });

  useEffect(() => {
    setQueryParams((prev) => ({
      ...prev,
      type: isValidType(typeFilter) ? typeFilter : undefined,
      search: searchFilter || undefined,
      page: currentPage,
    }));
  }, [typeFilter, searchFilter, currentPage]);

  const { data, isLoading } = useAccommodations(queryParams);

  const buildUrl = (
    next: { type?: AccommodationType; search?: string },
    page = 1
  ): string => {
    const sp = new URLSearchParams();
    if (next.type) sp.set("type", next.type);
    if (next.search) sp.set("search", next.search);
    sp.set("page", String(page));
    return `/${locale}/accommodations?${sp.toString()}`;
  };

  const handleTypeChange = (type?: AccommodationType) => {
    router.push(buildUrl({ type, search: searchFilter }, 1));
  };

  const handleSearch = () => {
    router.push(buildUrl({ type: validatedType, search: searchInput }, 1));
  };

  const handlePageChange = (page: number) => {
    router.push(buildUrl({ type: validatedType, search: searchFilter }, page));
  };

  const hasResults = data?.data && data.data.length > 0;

  const typeButtons: { key: string; label: string; icon: typeof Home; value?: AccommodationType }[] =
    [
      { key: "all", label: t("allTypes"), icon: LayoutGrid, value: undefined },
      { key: "HOTEL", label: t("hotels"), icon: Building2, value: AccommodationType.HOTEL },
      { key: "APARTMENT", label: t("apartments"), icon: Home, value: AccommodationType.APARTMENT },
    ];

  return (
    <main className="w-full min-h-screen md:px-20 px-4 pt-6 md:pt-20 pb-20">
      <div className="w-full">
        <header className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-brand-green">
            {t("title")}
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            {t("subtitle")}
          </p>
        </header>

        <div className="flex flex-col md:flex-row gap-4 mb-8 md:items-center md:justify-between">
          <div className="flex gap-2 flex-wrap">
            {typeButtons.map((btn) => {
              const Icon = btn.icon;
              const active =
                (btn.value === undefined && !validatedType) ||
                btn.value === validatedType;
              return (
                <Button
                  key={btn.key}
                  variant={active ? "default" : "outline"}
                  onClick={() => handleTypeChange(btn.value)}
                  className="h-9 gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {btn.label}
                </Button>
              );
            })}
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t("searchPlaceholder")}
              className="h-9 md:w-64 border-brand-green-100 focus-visible:ring-brand-green"
            />
            <Button onClick={handleSearch} className="h-9 gap-2">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <ToursSectionLoader />
        ) : hasResults ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.data.map((item: Accommodation) => (
                <AccommodationCard key={item.id} item={item} />
              ))}
            </div>

            {data?.meta && data.meta.totalPages > 1 && (
              <ToursPagination
                currentPage={queryParams.page || 1}
                totalPages={data.meta.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-600">{t("noResults")}</p>
            {(validatedType || searchFilter) && (
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/accommodations?page=1`)}
                className="mt-4"
              >
                {t("resetFilters")}
              </Button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
