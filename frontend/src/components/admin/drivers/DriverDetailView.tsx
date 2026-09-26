"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Car,
  ImagePlus,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Route,
  Star,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Link } from "@/src/i18n/routing";
import PageHeader from "@/src/components/admin/common/PageHeader";
import PrintButton from "@/src/components/admin/common/PrintButton";
import Panel from "@/src/components/admin/common/Panel";
import StatCard from "@/src/components/admin/common/StatCard";
import ConfirmDialog from "@/src/components/admin/common/ConfirmDialog";
import RowActions from "@/src/components/admin/common/RowActions";
import Thumb from "@/src/components/admin/common/Thumb";
import {
  useDeleteDriverReview,
  useDriver,
  useDriverCarPhotos,
  useDriverMonthly,
} from "@/src/hooks/admin/useDrivers";
import { useDeleteVehicle, useVehicles } from "@/src/hooks/admin/useVehicles";
import { useRouter } from "@/src/i18n/routing";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import {
  formatDate,
  formatDateTime,
  formatNumber,
  fullName,
} from "@/src/utlis/admin/format";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import { imageUrl } from "@/src/utlis/admin/media";
import { adminPaths } from "@/src/utlis/admin/paths";
import { cn } from "@/src/utlis/cn";
import type { Vehicle } from "@/src/types/admin/drivers.types";
import DriverFormDialog from "./DriverFormDialog";
import VehicleFormDialog from "@/src/components/admin/vehicles/VehicleFormDialog";

const TABS = ["overview", "vehicles", "photos", "monthly", "reviews"] as const;
type Tab = (typeof TABS)[number];

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-gray-800">{children}</dd>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((step) => (
        <Star
          key={step}
          className={cn(
            "h-3.5 w-3.5",
            step <= rating
              ? "fill-brand-yellow text-brand-yellow"
              : "fill-gray-200 text-gray-200"
          )}
        />
      ))}
    </span>
  );
}

export default function DriverDetailView({ id }: { id: string }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const errorMessage = useApiErrorMessage();
  const { can } = usePermissions();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("overview");
  const [year, setYear] = useState<number | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState<{
    open: boolean;
    vehicle: Vehicle | null;
  }>({ open: false, vehicle: null });
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  const { data: driver, isLoading, isError } = useDriver(id);
  const vehicles = useVehicles({
    driverId: id,
    limit: 100,
    sortBy: "createdAt",
  });
  const monthly = useDriverMonthly(id, year);
  const carPhotos = useDriverCarPhotos(id);
  const deleteVehicle = useDeleteVehicle();
  const deleteReview = useDeleteDriverReview();
  const fileInput = useRef<HTMLInputElement>(null);

  const monthNames = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "long" });
    return Array.from({ length: 12 }, (_, index) =>
      formatter.format(new Date(2026, index, 1))
    );
  }, [locale]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !driver) {
    return (
      <Panel>
        <div className="py-10 text-center">
          <p className="font-semibold text-gray-800">{t("errors.NOT_FOUND")}</p>
          <Link
            href={adminPaths.drivers}
            className="mt-3 inline-block text-sm font-medium text-brand-green hover:underline"
          >
            {t("nav.drivers")}
          </Link>
        </div>
      </Panel>
    );
  }

  const uploadPhotos = async (files: File[]) => {
    if (!files.length) return;
    try {
      await carPhotos.add.mutateAsync(files);
      toast.success(t("drivers.photosUploaded"));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const removeCarPhoto = async () => {
    if (!photoToDelete) return;
    try {
      await carPhotos.remove.mutateAsync(photoToDelete);
      toast.success(t("drivers.photoDeleted"));
    } catch (error) {
      toast.error(errorMessage(error));
    }
    setPhotoToDelete(null);
  };

  const removeVehicle = async () => {
    if (!vehicleToDelete) return;
    try {
      await deleteVehicle.mutateAsync(vehicleToDelete.id);
      toast.success(t("vehicles.deleted"));
    } catch (error) {
      toast.error(errorMessage(error));
    }
    setVehicleToDelete(null);
  };

  const removeReview = async () => {
    if (!reviewToDelete) return;
    try {
      await deleteReview.mutateAsync(reviewToDelete);
      toast.success(t("drivers.reviewDeleted"));
    } catch (error) {
      toast.error(errorMessage(error));
    }
    setReviewToDelete(null);
  };

  const panelClass = (name: Tab) =>
    cn("space-y-4", tab !== name && "hidden print:block print:mt-6");

  return (
    <div>
      <PageHeader
        title={fullName(driver)}
        description={t("drivers.detailSubtitle")}
        backHref={adminPaths.drivers}
        backLabel={t("nav.drivers")}
        printTitle={fullName(driver)}
        actions={
          <>
            <PrintButton />
            {can("TRANSACTIONS", "create") && (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    adminPaths.transactionNew({
                      driverId: id,
                      type: "EXPENSE",
                    })
                  )
                }
              >
                <Wallet />
                {t("transactions.addExpense")}
              </Button>
            )}
            {can("DRIVERS", "create") && (
              <Button
                variant="outline"
                onClick={() => setVehicleForm({ open: true, vehicle: null })}
              >
                <Plus />
                {t("vehicles.new")}
              </Button>
            )}
            {can("DRIVERS", "edit") && (
              <Button onClick={() => setEditOpen(true)}>
                <Pencil />
                {t("common.edit")}
              </Button>
            )}
          </>
        }
      />

      {/* Identity card */}
      <Panel className="mb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Thumb
            src={driver.photo}
            alt={fullName(driver)}
            className="h-20 w-20 rounded-2xl"
            sizes="80px"
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold text-gray-900">
              {fullName(driver)}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge tone={driver.isActive ? "green" : "neutral"}>
                {driver.isActive ? t("users.active") : t("users.inactive")}
              </Badge>
              <Badge tone={driver.showOnWebsite ? "yellow" : "neutral"}>
                {driver.showOnWebsite
                  ? t("drivers.onWebsite")
                  : t("drivers.internal")}
              </Badge>
              {driver.languages.map((language) => (
                <span
                  key={language}
                  className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                >
                  {language}
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              {driver.phone && (
                <a
                  href={`tel:${driver.phone}`}
                  className="flex items-center gap-1.5 text-gray-700 hover:text-brand-green"
                  dir="ltr"
                >
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  {driver.phone}
                </a>
              )}
              {driver.email && (
                <a
                  href={`mailto:${driver.email}`}
                  className="flex items-center gap-1.5 text-gray-700 hover:text-brand-green"
                  dir="ltr"
                >
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  {driver.email}
                </a>
              )}
            </div>
          </div>
        </div>
      </Panel>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("drivers.rating")}
          value={
            driver.averageRating !== null
              ? formatNumber(driver.averageRating, locale, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })
              : "—"
          }
          hint={t("drivers.reviewsCount", { count: driver.totalReviews })}
          icon={Star}
          tone="yellow"
        />
        <StatCard
          label={t("nav.vehicles")}
          value={driver.counts.vehicles}
          icon={Car}
        />
        <StatCard
          label={t("drivers.transferJobs")}
          value={monthly.data?.totals.transferJobs ?? 0}
          hint={t("drivers.inYear", {
            year: String(monthly.data?.year ?? new Date().getFullYear()),
          })}
          icon={Route}
          tone="blue"
        />
        <StatCard
          label={t("drivers.dailyRentPrice")}
          value={
            driver.dailyRentPrice !== null
              ? `${formatNumber(driver.dailyRentPrice, locale)} ₾`
              : "—"
          }
          icon={Wallet}
          tone="neutral"
        />
      </div>

      {/* Tabs (every panel is printed, whichever is on screen) */}
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 print:hidden">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            aria-current={tab === name}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
              tab === name
                ? "bg-white text-brand-green shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t(`drivers.tabs.${name}`)}
          </button>
        ))}
      </div>

      {/* Overview */}
      <div className={panelClass("overview")}>
        <Panel title={t("drivers.tabs.overview")}>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t("users.phone")}>
              {driver.phone ?? <span className="text-gray-300">—</span>}
            </Field>
            <Field label={t("users.email")}>
              {driver.email ?? <span className="text-gray-300">—</span>}
            </Field>
            <Field label={t("drivers.languages")}>
              {driver.languages.length ? (
                driver.languages.join(", ")
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </Field>
            <Field label={t("drivers.dailyRentPrice")}>
              {driver.dailyRentPrice !== null ? (
                `${formatNumber(driver.dailyRentPrice, locale)} ₾`
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </Field>
            <Field label={t("drivers.referrer")}>
              {driver.referrer ? (
                <Link
                  href={adminPaths.partners}
                  className="font-medium text-brand-green hover:underline"
                >
                  {driver.referrer.name}
                </Link>
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </Field>
            <Field label={t("drivers.referrerRate")}>
              {driver.referrerCommissionRate !== null ? (
                `${formatNumber(driver.referrerCommissionRate, locale)}%`
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </Field>
            <Field label={t("common.owner")}>
              {driver.createdBy ? (
                fullName(driver.createdBy)
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </Field>
            <Field label={t("common.createdAt")}>
              {formatDate(driver.createdAt, locale)}
            </Field>
            <Field label={t("common.updatedAt")}>
              {formatDate(driver.updatedAt, locale)}
            </Field>
          </dl>

          {driver.notes && (
            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("common.notes")}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
                {driver.notes}
              </p>
            </div>
          )}
        </Panel>
      </div>

      {/* Vehicles */}
      <div className={panelClass("vehicles")}>
        <Panel
          title={t("nav.vehicles")}
          description={t("drivers.vehiclesHint")}
          actions={
            can("DRIVERS", "create") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setVehicleForm({ open: true, vehicle: null })}
              >
                <Plus />
                {t("vehicles.new")}
              </Button>
            )
          }
          noPadding
        >
          {vehicles.isLoading ? (
            <div className="space-y-2 p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (vehicles.data?.data.length ?? 0) === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">
              {t("drivers.noVehicle")}
            </p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {vehicles.data?.data.map((vehicle) => (
                <li
                  key={vehicle.id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-green-50 text-brand-green print:hidden">
                    <Car className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">
                      {vehicle.brand} {vehicle.model}
                      {vehicle.year ? ` · ${vehicle.year}` : ""}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {t(`vehicles.${vehicle.type}`)} ·{" "}
                      {t("vehicles.seatsCount", { count: vehicle.seats })}
                      {vehicle.plateNumber ? ` · ${vehicle.plateNumber}` : ""}
                      {vehicle.color ? ` · ${vehicle.color}` : ""}
                    </p>
                  </div>
                  <Badge
                    tone={vehicle.ownership === "COMPANY" ? "green" : "neutral"}
                  >
                    {t(`vehicles.ownerships.${vehicle.ownership}`)}
                  </Badge>
                  {!vehicle.isActive && (
                    <Badge tone="neutral">{t("users.inactive")}</Badge>
                  )}
                  <span className="print:hidden">
                    <RowActions
                      actions={[
                        {
                          key: "edit",
                          label: t("common.edit"),
                          icon: Pencil,
                          onSelect: () =>
                            setVehicleForm({ open: true, vehicle }),
                          hidden: !can("DRIVERS", "edit"),
                        },
                        {
                          key: "delete",
                          label: t("common.delete"),
                          icon: Trash2,
                          danger: true,
                          separated: true,
                          onSelect: () => setVehicleToDelete(vehicle),
                          hidden: !can("DRIVERS", "delete"),
                        },
                      ]}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Car photos */}
      <div className={panelClass("photos")}>
        <Panel
          title={t("drivers.carPhotos")}
          description={t("drivers.carPhotosHint")}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {driver.carPhotos.map((photo) => (
              <div
                key={photo}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100"
              >
                <Image
                  src={imageUrl(photo)}
                  alt={t("drivers.carPhotos")}
                  fill
                  sizes="(max-width: 640px) 50vw, 200px"
                  className="object-cover"
                />
                {can("DRIVERS", "edit") && (
                  <button
                    type="button"
                    onClick={() => setPhotoToDelete(photo)}
                    aria-label={t("common.delete")}
                    className="absolute end-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-red-500 print:hidden"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}

            {can("DRIVERS", "edit") && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={carPhotos.add.isPending}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-brand-green hover:text-brand-green disabled:opacity-50 print:hidden"
              >
                {carPhotos.add.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
                <span className="text-xs font-semibold">
                  {t("drivers.upload")}
                </span>
              </button>
            )}
          </div>

          {driver.carPhotos.length === 0 && !can("DRIVERS", "edit") && (
            <p className="py-6 text-center text-sm text-gray-500">
              {t("drivers.noCarPhotos")}
            </p>
          )}

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              void uploadPhotos(files);
            }}
          />
        </Panel>
      </div>

      {/* Monthly activity */}
      <div className={panelClass("monthly")}>
        <Panel
          title={t("drivers.tabs.monthly")}
          description={t("drivers.monthlyHint")}
          actions={
            <div className="flex flex-wrap gap-1 print:hidden">
              {(monthly.data?.availableYears ?? []).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setYear(option)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-sm font-semibold transition-colors",
                    (monthly.data?.year ?? 0) === option
                      ? "bg-brand-green text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          }
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 text-start">{t("common.month")}</th>
                  <th className="px-5 py-3 text-end">
                    {t("drivers.transferJobs")}
                  </th>
                  <th className="px-5 py-3 text-end">
                    {t("drivers.transferRevenue")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(monthly.data?.months ?? []).map((month) => (
                  <tr
                    key={month.month}
                    className={cn(
                      "border-b border-gray-50 last:border-0",
                      month.transferJobs === 0 && "text-gray-400"
                    )}
                  >
                    <td className="px-5 py-2.5">
                      {monthNames[month.month - 1]}
                    </td>
                    <td className="px-5 py-2.5 text-end tabular-nums">
                      {month.transferJobs}
                    </td>
                    <td className="px-5 py-2.5 text-end tabular-nums">
                      {formatNumber(month.transferRevenue, locale, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ₾
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td className="px-5 py-3">{t("common.total")}</td>
                  <td className="px-5 py-3 text-end tabular-nums">
                    {monthly.data?.totals.transferJobs ?? 0}
                  </td>
                  <td className="px-5 py-3 text-end tabular-nums">
                    {formatNumber(
                      monthly.data?.totals.transferRevenue ?? 0,
                      locale,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}{" "}
                    ₾
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>

        {(monthly.data?.jobs.length ?? 0) > 0 && (
          <Panel title={t("drivers.jobs")} noPadding>
            <ul className="divide-y divide-gray-50">
              {monthly.data?.jobs.map((job) => (
                <li key={job.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-gray-900">
                      {job.transferStartLocation} → {job.transferEndLocation}
                    </p>
                    <p className="font-semibold tabular-nums text-gray-900">
                      {formatNumber(job.paymentAmount, locale, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ₾
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(job.transferDate, locale)} ·{" "}
                    {job.customerFirstName} {job.customerLastName} ·{" "}
                    {t("drivers.passengers", { count: job.passengerCount })}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      {/* Reviews */}
      <div className={panelClass("reviews")}>
        <Panel
          title={t("drivers.tabs.reviews")}
          description={t("drivers.reviewsHint")}
          noPadding
        >
          {driver.reviews.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">
              {t("drivers.noReviews")}
            </p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {driver.reviews.map((review) => (
                <li key={review.id} className="flex gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {review.reviewerName}
                      </span>
                      <Stars rating={review.rating} />
                      <span className="text-xs text-gray-400">
                        {formatDateTime(review.createdAt, locale)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="mt-0.5 text-sm text-gray-600">
                        {review.comment}
                      </p>
                    )}
                  </div>
                  {can("DRIVERS", "edit") && (
                    <button
                      type="button"
                      onClick={() => setReviewToDelete(review.id)}
                      aria-label={t("common.delete")}
                      className="h-8 w-8 shrink-0 rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 print:hidden"
                    >
                      <X className="mx-auto h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <DriverFormDialog
        open={editOpen}
        driver={driver}
        onOpenChange={setEditOpen}
      />

      <VehicleFormDialog
        open={vehicleForm.open}
        vehicle={vehicleForm.vehicle}
        onOpenChange={(open) => setVehicleForm((prev) => ({ ...prev, open }))}
        presetDriverId={id}
        lockDriver={!vehicleForm.vehicle}
      />

      <ConfirmDialog
        open={!!vehicleToDelete}
        onOpenChange={(open) => !open && setVehicleToDelete(null)}
        title={t("vehicles.deleteTitle")}
        description={t("vehicles.deleteText", {
          name: vehicleToDelete
            ? `${vehicleToDelete.brand} ${vehicleToDelete.model}`
            : "",
        })}
        loading={deleteVehicle.isPending}
        onConfirm={() => void removeVehicle()}
      />

      <ConfirmDialog
        open={!!photoToDelete}
        onOpenChange={(open) => !open && setPhotoToDelete(null)}
        title={t("drivers.deletePhotoTitle")}
        description={t("drivers.deletePhotoText")}
        loading={carPhotos.remove.isPending}
        onConfirm={() => void removeCarPhoto()}
      />

      <ConfirmDialog
        open={!!reviewToDelete}
        onOpenChange={(open) => !open && setReviewToDelete(null)}
        title={t("drivers.deleteReviewTitle")}
        description={t("drivers.deleteReviewText")}
        loading={deleteReview.isPending}
        onConfirm={() => void removeReview()}
      />
    </div>
  );
}
