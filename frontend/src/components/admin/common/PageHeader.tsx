"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/routing";
import { cn } from "@/src/utlis/cn";
import PrintHeader from "./PrintHeader";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons on the right (hidden when printing). */
  actions?: React.ReactNode;
  /** Shows a back link above the title. */
  backHref?: string;
  backLabel?: string;
  /** Plain-text title for the print header (defaults to `title` if a string). */
  printTitle?: string;
  /** Human readable summary of active filters for printouts. */
  printFilters?: string;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel,
  printTitle,
  printFilters,
  className,
}: PageHeaderProps) {
  const t = useTranslations("admin.form");

  return (
    <>
      <PrintHeader
        title={printTitle ?? (typeof title === "string" ? title : "")}
        filters={printFilters}
      />
      <div
        className={cn(
          "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden",
          className
        )}
      >
        <div className="min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-brand-green"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {backLabel ?? t("back")}
            </Link>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 lg:text-[1.75rem]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </>
  );
}
