"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  Coins,
  Loader2,
  Plus,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Link, useRouter } from "@/src/i18n/routing";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import PageHeader from "@/src/components/admin/common/PageHeader";
import Panel from "@/src/components/admin/common/Panel";
import StatCard from "@/src/components/admin/common/StatCard";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { ADMIN_NAV } from "@/src/components/admin/shell/nav";
import { useFinanceReport } from "@/src/hooks/admin/useFinance";
import { useBookingSummary } from "@/src/hooks/admin/useBookings";
import { useCalendarRange } from "@/src/hooks/admin/useCalendar";
import { useLatestRates } from "@/src/hooks/admin/useCurrency";
import {
  formatDateOnly,
  formatNumber,
  toDateOnly,
} from "@/src/utlis/admin/format";
import { adminPaths, legacyAdminRedirect } from "@/src/utlis/admin/paths";
import { cn } from "@/src/utlis/cn";

export default function DashboardView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, can, allows } = usePermissions();

  // Old bookmarks like /admin?tours=all → new pages.
  const legacyTarget = legacyAdminRedirect(searchParams);
  useEffect(() => {
    if (legacyTarget) router.replace(legacyTarget);
  }, [legacyTarget, router]);

  const today = new Date();
  const monthStart = toDateOnly(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const monthEnd = toDateOnly(
    new Date(today.getFullYear(), today.getMonth() + 1, 0)
  );
  const weekEnd = toDateOnly(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)
  );

  const canSeeFinance = can("FINANCE");
  const canSeeBookings =
    can("BOOKINGS_HOTEL") || can("BOOKINGS_TOUR") || can("BOOKINGS_PACKAGE");

  const finance = useFinanceReport(
    { dateFrom: monthStart, dateTo: monthEnd },
    canSeeFinance
  );
  const bookings = useBookingSummary(
    { dateFrom: monthStart, dateTo: monthEnd },
    canSeeBookings && !canSeeFinance
  );
  const calendar = useCalendarRange(
    toDateOnly(today),
    weekEnd,
    undefined,
    can("CALENDAR")
  );
  const rates = useLatestRates(can("CURRENCY"));

  const financeData = canSeeFinance ? finance.data : undefined;
  const bookingRows = canSeeBookings ? (bookings.data ?? []) : [];

  const upcoming = useMemo(() => {
    const events = (calendar.data?.events ?? []).map((event) => ({
      id: event.id,
      date: event.date,
      title: event.title,
      subtitle: event.subtitle,
      href: event.bookingId ? adminPaths.booking(event.bookingId) : null,
      kind: t(`calendar.eventTypes.${event.type}`),
    }));
    const notes = (calendar.data?.notes ?? [])
      .filter((note) => !note.isDone)
      .map((note) => ({
        id: note.id,
        date: note.date,
        title: note.title,
        subtitle: note.content,
        href: adminPaths.calendar,
        kind: t("calendar.notes"),
      }));
    return [...events, ...notes]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 12);
  }, [calendar.data, t]);

  const groups = ADMIN_NAV.filter((group) => group.key !== "overview")
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allows(item.requires)),
    }))
    .filter((group) => group.items.length > 0);

  if (legacyTarget) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-brand-green" />
      </div>
    );
  }

  const money = (amount: number, currency = "GEL") =>
    `${formatNumber(amount, locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.welcome", { name: user?.firstName ?? "" })}
        description={t("dashboard.subtitle")}
        actions={
          <div className="flex flex-wrap gap-2">
            {canSeeBookings && can("BOOKINGS_HOTEL", "create") && (
              <Button onClick={() => router.push(adminPaths.bookingNew)}>
                <Plus />
                {t("bookings.new")}
              </Button>
            )}
            {can("TRANSACTIONS", "create") && (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(adminPaths.transactionNew({ type: "EXPENSE" }))
                }
              >
                <Plus />
                {t("transactions.addExpense")}
              </Button>
            )}
          </div>
        }
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
        <>
          {/* This month */}
          {(canSeeFinance || canSeeBookings) && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                {t("dashboard.thisMonth")}
              </h2>
              {finance.isLoading || bookings.isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[0, 1, 2, 3].map((index) => (
                    <Skeleton key={index} className="h-24 rounded-2xl" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {canSeeFinance && financeData ? (
                    <>
                      <StatCard
                        label={t("finance.revenue")}
                        value={money(financeData.kpis.revenue)}
                        icon={TrendingUp}
                      />
                      <StatCard
                        label={t("finance.netResult")}
                        value={money(financeData.kpis.netResult)}
                        icon={Wallet}
                        tone={financeData.kpis.netResult < 0 ? "red" : "green"}
                      />
                      <StatCard
                        label={t("finance.expenses")}
                        value={money(financeData.kpis.expenses)}
                        icon={Coins}
                        tone="red"
                      />
                      <StatCard
                        label={t("finance.outstanding")}
                        value={money(financeData.kpis.outstanding)}
                        icon={Wallet}
                        tone="yellow"
                      />
                    </>
                  ) : (
                    bookingRows.map((row) => (
                      <StatCard
                        key={row.currency}
                        label={`${t("bookings.totalPrice")} · ${row.currency}`}
                        value={money(row.totalPrice, row.currency)}
                        hint={t("bookings.countLabel", { count: row.count })}
                        icon={TrendingUp}
                      />
                    ))
                  )}
                  {!canSeeFinance && bookingRows.length === 0 && (
                    <StatCard
                      label={t("bookings.countLabel", { count: 0 })}
                      value="0"
                      icon={TrendingUp}
                      tone="neutral"
                    />
                  )}
                </div>
              )}
            </section>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            {/* The next seven days */}
            <div className="min-w-0 lg:col-span-2">
              <Panel
                title={t("dashboard.next7Days")}
                description={t("dashboard.next7DaysHint")}
                actions={
                  <Link
                    href={adminPaths.calendar}
                    className="text-sm font-semibold text-brand-green hover:underline"
                  >
                    {t("nav.calendar")}
                  </Link>
                }
                noPadding
              >
                {calendar.isLoading ? (
                  <div className="space-y-2 p-5">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : upcoming.length === 0 ? (
                  <p className="p-8 text-center text-sm text-gray-500">
                    {t("dashboard.nothingUpcoming")}
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {upcoming.map((row) => {
                      const body = (
                        <>
                          <span className="w-20 shrink-0 text-xs font-semibold text-gray-500">
                            {formatDateOnly(row.date, locale, {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold text-gray-900">
                              {row.title}
                            </span>
                            <span className="block truncate text-xs text-gray-500">
                              {row.kind}
                              {row.subtitle ? ` · ${row.subtitle}` : ""}
                            </span>
                          </span>
                        </>
                      );
                      return (
                        <li key={row.id}>
                          {row.href ? (
                            <Link
                              href={row.href}
                              className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-gray-50"
                            >
                              {body}
                            </Link>
                          ) : (
                            <span className="flex items-center gap-3 px-5 py-2.5">
                              {body}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Panel>
            </div>

            {/* Rates */}
            {can("CURRENCY") && (
              <Panel
                title={t("nav.currency")}
                actions={
                  <Link
                    href={adminPaths.currency}
                    className="text-sm font-semibold text-brand-green hover:underline"
                  >
                    {t("common.details")}
                  </Link>
                }
                noPadding
              >
                {rates.isLoading ? (
                  <div className="space-y-2 p-5">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {(rates.data ?? [])
                      .filter((rate) => rate.currency !== "GEL")
                      .map((rate) => (
                        <li
                          key={rate.currency}
                          className="flex items-center justify-between px-5 py-2.5"
                        >
                          <span className="font-semibold text-gray-800">
                            1 {rate.currency}
                          </span>
                          <span
                            className={cn(
                              "tabular-nums",
                              rate.stale ? "text-amber-600" : "text-gray-700"
                            )}
                          >
                            {formatNumber(rate.rate, locale, {
                              maximumFractionDigits: 4,
                            })}{" "}
                            GEL
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
              </Panel>
            )}
          </div>

          {/* Everything this user can open */}
          <div className="space-y-6">
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
        </>
      )}
    </div>
  );
}
