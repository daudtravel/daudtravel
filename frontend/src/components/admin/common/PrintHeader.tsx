"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/src/auth/authProvider";
import { formatDateTime, fullName } from "@/src/utlis/admin/format";

/**
 * Letterhead that only appears on paper: logo, document title, filters and
 * who/when generated it. Rendered by PageHeader on every admin page.
 */
export default function PrintHeader({
  title,
  filters,
}: {
  title: string;
  filters?: string;
}) {
  const t = useTranslations("admin.print");
  const locale = useLocale();
  const { user } = useAuth();
  const [now, setNow] = useState<Date | null>(null);

  // Refresh the timestamp right before printing.
  useEffect(() => {
    setNow(new Date());
    const onBeforePrint = () => setNow(new Date());
    window.addEventListener("beforeprint", onBeforePrint);
    return () => window.removeEventListener("beforeprint", onBeforePrint);
  }, []);

  return (
    <div className="mb-4 hidden border-b-2 border-brand-green pb-3 print:block">
      <div className="flex items-start justify-between gap-4">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/Logo.png" alt="Daud Travel" className="h-12 w-auto" />
        </div>
        <div className="text-end text-[10px] leading-relaxed text-gray-600">
          {now && <p>{t("generatedAt", { date: formatDateTime(now, locale) })}</p>}
          {user && <p>{t("generatedBy", { name: fullName(user) })}</p>}
        </div>
      </div>
      {title && <h1 className="mt-3 text-lg font-bold text-black">{title}</h1>}
      {filters && (
        <p className="mt-1 text-[10px] text-gray-600">
          {t("filtersApplied", { filters })}
        </p>
      )}
    </div>
  );
}
