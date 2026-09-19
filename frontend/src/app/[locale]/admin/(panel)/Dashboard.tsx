"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Link, useRouter } from "@/src/i18n/routing";
import { legacyAdminRedirect } from "@/src/utlis/admin/paths";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { ADMIN_NAV } from "@/src/components/admin/shell/nav";
import PageHeader from "@/src/components/admin/common/PageHeader";

export default function Dashboard() {
  const t = useTranslations("admin");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, allows } = usePermissions();

  // Old bookmarks like /admin?tours=all → new pages.
  const legacyTarget = legacyAdminRedirect(searchParams);
  useEffect(() => {
    if (legacyTarget) router.replace(legacyTarget);
  }, [legacyTarget, router]);

  if (legacyTarget) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-brand-green" />
      </div>
    );
  }

  const groups = ADMIN_NAV.filter((g) => g.key !== "overview")
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allows(item.requires)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div>
      <PageHeader
        title={t("dashboard.welcome", { name: user?.firstName ?? "" })}
        description={t("dashboard.subtitle")}
      />

      {groups.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-gray-100 bg-white px-6 py-14 text-center shadow-sm">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green-50 text-brand-green">
            <Sparkles className="h-7 w-7" />
          </span>
          <h2 className="text-lg font-bold text-gray-900">
            {t("access.noModulesTitle")}
          </h2>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            {t("access.noModulesText")}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                {t(`nav.groups.${group.key}`)}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-green-100 hover:shadow-md"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green-50 text-brand-green transition-colors group-hover:bg-brand-green group-hover:text-brand-cream">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold text-gray-800">
                        {t(`nav.${item.key}`)}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-green rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
