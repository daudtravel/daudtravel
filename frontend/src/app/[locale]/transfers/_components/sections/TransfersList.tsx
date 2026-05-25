"use client";

import { useLocale, useTranslations } from "next-intl";
import { Loader2, AlertCircle } from "lucide-react";
import { Transfer } from "@/src/types/transfers.types";
import { useTransfers } from "@/src/hooks/transfers/useTransfers";
import { TransferCard } from "../cards/TransferCard";

export function TransfersList() {
  const t = useTranslations("transfers");
  const locale = useLocale();

  const { data, isLoading, isError } = useTransfers({ locale, publicOnly: true });
  const transfers: Transfer[] = data?.data || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-mid" />
        <p className="text-sm text-gray-500">{t("loading") || "Loading transfers…"}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="p-3 bg-red-50 rounded-full">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-sm text-red-600">{t("errorLoadingTransfers")}</p>
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-sm">{t("noTransfers")}</p>
      </div>
    );
  }

  return (
    <section className="px-4 md:px-20 py-12">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-green-mid mb-1">
          {t("availableRoutes") || "Available Routes"}
        </p>
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
          {t("chooseYourRoute") || "Choose Your Route"}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {transfers.map((transfer) => (
          <TransferCard key={transfer.id} transfer={transfer} />
        ))}
      </div>

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-10">
          {data.pagination.hasPreviousPage && (
            <button className="px-4 py-2 rounded-xl border border-brand-green text-brand-green text-sm font-medium hover:bg-brand-green-50 transition-colors">
              {t("previous") || "Previous"}
            </button>
          )}
          <span className="text-sm text-gray-500">
            {data.pagination.currentPage} / {data.pagination.totalPages}
          </span>
          {data.pagination.hasNextPage && (
            <button className="px-4 py-2 rounded-xl border border-brand-green text-brand-green text-sm font-medium hover:bg-brand-green-50 transition-colors">
              {t("next") || "Next"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
