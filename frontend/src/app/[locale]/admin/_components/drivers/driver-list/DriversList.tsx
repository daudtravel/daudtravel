"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Plus,
  Loader2,
  User,
  Trash,
  Star,
  MessageSquare,
  ChevronDown,
  X,
  Users,
  Pencil,
  ImagePlus,
} from "lucide-react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { driversAPI, Driver, DriverReview } from "@/src/services/drivers.service";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3 w-3 ${s <= rating ? "text-brand-yellow fill-brand-yellow" : "text-gray-200 fill-gray-200"}`}
        />
      ))}
    </div>
  );
}

function ReviewsPanel({ driver }: { driver: Driver }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const t = useTranslations("admin");
  const locale = useLocale();

  const { data, isLoading } = useQuery({
    queryKey: ["driver-reviews", driver.id],
    queryFn: () => driversAPI.getReviews(driver.id),
    enabled: open,
    staleTime: 1000 * 60 * 2,
  });

  const { mutate: deleteReview, isPending: isDeletingReview } = useMutation({
    mutationFn: (reviewId: string) => driversAPI.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-reviews", driver.id] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });

  const reviews: DriverReview[] = data?.data?.reviews ?? driver.recentReviews ?? [];

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-brand-green-mid hover:text-brand-green transition-colors font-medium"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {t("drivers.reviewsCount", { count: driver.totalReviews })}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-brand-green-mid" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-xs text-gray-400">{t("drivers.noReviews")}</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-800">{review.reviewerName}</span>
                    <StarRow rating={review.rating} />
                  </div>
                  {review.comment && <p className="text-xs text-gray-500">{review.comment}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(review.createdAt).toLocaleDateString(locale)}
                  </p>
                </div>
                <button
                  disabled={isDeletingReview}
                  onClick={() => deleteReview(review.id)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function DriversList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("admin");

  const { data, isLoading, error } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => driversAPI.get(),
    staleTime: 1000 * 60 * 5,
  });

  const { mutate: deleteDriver, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => driversAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success(t("drivers.deleted"));
    },
    onError: (err: Error) => toast.error(err?.message || t("common.deleteFailed")),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-7 w-7 animate-spin text-brand-green-mid" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-medium text-sm">{t("drivers.loadFailed")}</p>
        </div>
      </div>
    );
  }

  const drivers: Driver[] = data?.data ?? [];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 lg:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t("drivers.title")}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {t("drivers.total", { count: drivers.length })}
          </p>
        </div>
        <button
          onClick={() => router.push("?drivers=createDriver")}
          className="flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          {t("drivers.add")}
        </button>
      </div>

      {drivers.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center min-h-[300px] p-8 gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-green-50 flex items-center justify-center">
            <Users className="h-7 w-7 text-brand-green-mid" />
          </div>
          <p className="text-gray-500">{t("drivers.notFound")}</p>
          <button
            onClick={() => router.push("?drivers=createDriver")}
            className="flex items-center gap-2 border border-brand-green text-brand-green hover:bg-brand-green-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t("drivers.addFirst")}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[56px_1fr_160px_100px_88px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400">
            <span />
            <span>{t("drivers.colDriver")}</span>
            <span>{t("drivers.colRating")}</span>
            <span>{t("drivers.colReviewCount")}</span>
            <span />
          </div>

          <div className="divide-y divide-gray-50">
            {drivers.map((driver: Driver) => (
              <DriverRow
                key={driver.id}
                driver={driver}
                isDeleting={isDeleting}
                onDelete={deleteDriver}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EditDriverModal({
  driver,
  isOpen,
  onClose,
}: {
  driver: Driver;
  isOpen: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const t = useTranslations("admin");
  const [firstName, setFirstName] = useState(driver.firstName);
  const [lastName, setLastName] = useState(driver.lastName);
  const [languages, setLanguages] = useState(driver.languages.join(", "));
  const [dailyRentPrice, setDailyRentPrice] = useState(
    driver.dailyRentPrice !== null ? String(driver.dailyRentPrice) : ""
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["drivers"] });
    queryClient.invalidateQueries({ queryKey: ["driver", driver.id] });
  };

  const { mutate: saveDriver, isPending: isSaving } = useMutation({
    mutationFn: () =>
      driversAPI.update(driver.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        languages: languages
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
        dailyRentPrice: dailyRentPrice.trim() === "" ? null : Number(dailyRentPrice),
      }),
    onSuccess: () => {
      invalidate();
      toast.success(t("drivers.updated"));
      onClose();
    },
    onError: () => toast.error(t("common.updateFailed")),
  });

  const { mutate: uploadPhotos, isPending: isUploading } = useMutation({
    mutationFn: (files: File[]) => driversAPI.uploadCarPhotos(driver.id, files),
    onSuccess: () => {
      invalidate();
      toast.success(t("drivers.photosUploaded"));
    },
    onError: () => toast.error(t("drivers.photosUploadFailed")),
  });

  const { mutate: removePhoto, isPending: isRemoving } = useMutation({
    mutationFn: (url: string) => driversAPI.deleteCarPhoto(driver.id, url),
    onSuccess: () => {
      invalidate();
      toast.success(t("drivers.photoDeleted"));
    },
    onError: () => toast.error(t("drivers.photoDeleteFailed")),
  });

  const submit = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error(t("drivers.nameRequired"));
      return;
    }
    if (dailyRentPrice.trim() !== "" && (isNaN(Number(dailyRentPrice)) || Number(dailyRentPrice) < 0)) {
      toast.error(t("drivers.invalidPrice"));
      return;
    }
    saveDriver();
  };

  const busy = isSaving || isUploading || isRemoving;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-brand-green">
            {t("drivers.editTitle", {
              name: `${driver.firstName} ${driver.lastName}`,
            })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">{t("drivers.firstName")}</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">{t("drivers.lastName")}</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              {t("drivers.languages")}{" "}
              <span className="text-gray-400 text-xs font-normal">{t("drivers.commaSeparated")}</span>
            </Label>
            <Input
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="ქართული, English, Русский"
              disabled={busy}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              {t("drivers.dailyRentPrice")}{" "}
              <span className="text-gray-400 text-xs font-normal">{t("drivers.emptyNoRent")}</span>
            </Label>
            <Input
              type="number"
              min="0"
              value={dailyRentPrice}
              onChange={(e) => setDailyRentPrice(e.target.value)}
              placeholder="150"
              disabled={busy}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">{t("drivers.carPhotos")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {driver.carPhotos.map((photo) => (
                <div key={photo} className="relative aspect-[4/3] rounded-lg overflow-hidden group">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_BASE_URL}${photo}`}
                    alt={t("drivers.carAlt")}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => removePhoto(photo)}
                    className="absolute top-1 right-1 h-6 w-6 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors disabled:opacity-40"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <label
                className={`aspect-[4/3] rounded-lg border-2 border-dashed border-gray-200 hover:border-brand-green flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-gray-400 hover:text-brand-green ${busy ? "pointer-events-none opacity-50" : ""}`}
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
                <span className="text-[10px] font-medium">{t("drivers.upload")}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length > 0) uploadPhotos(files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t("common.close")}
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 px-4 py-2 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              t("common.save")
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DriverRow({
  driver,
  isDeleting,
  onDelete,
}: {
  driver: Driver;
  isDeleting: boolean;
  onDelete: (id: string) => void;
}) {
  const [showReviews, setShowReviews] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const t = useTranslations("admin");

  return (
    <div>
      <div className="grid grid-cols-[56px_1fr_auto] sm:grid-cols-[56px_1fr_160px_100px_88px] items-center gap-4 px-5 py-4">
        {/* Photo */}
        <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-brand-green-100 shrink-0">
          {driver.photo ? (
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_URL}${driver.photo}`}
              alt={`${driver.firstName} ${driver.lastName}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-brand-green-50 flex items-center justify-center">
              <User className="h-5 w-5 text-brand-green-mid" />
            </div>
          )}
        </div>

        {/* Name */}
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm">
            {driver.firstName} {driver.lastName}
          </p>
          <p className="text-xs text-gray-400 sm:hidden">
            {driver.averageRating !== null ? `★ ${driver.averageRating}` : t("drivers.noRating")}
          </p>
        </div>

        {/* Rating stars */}
        <div className="hidden sm:flex items-center gap-2">
          {driver.averageRating !== null ? (
            <>
              <StarRow rating={Math.round(driver.averageRating)} />
              <span className="text-sm font-semibold text-gray-700">{driver.averageRating}</span>
            </>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </div>

        {/* Review count + toggle */}
        <div className="hidden sm:block">
          {driver.totalReviews > 0 ? (
            <button
              onClick={() => setShowReviews((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-brand-green-mid hover:text-brand-green font-medium transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {driver.totalReviews}
              <ChevronDown className={`h-3 w-3 transition-transform ${showReviews ? "rotate-180" : ""}`} />
            </button>
          ) : (
            <span className="text-xs text-gray-300">0</span>
          )}
        </div>

        {/* Edit + Delete */}
        <div className="flex justify-end items-center gap-1">
          <button
            onClick={() => setEditOpen(true)}
            className="h-8 w-8 flex items-center justify-center rounded-xl text-gray-300 hover:text-brand-green hover:bg-brand-green-50 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={isDeleting}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                <Trash className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>{t("drivers.deleteTitle")}</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  {t("drivers.deleteConfirm", {
                    name: `${driver.firstName} ${driver.lastName}`,
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(driver.id)}
                  className="rounded-xl bg-red-500 hover:bg-red-600"
                >
                  {t("common.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Reviews expandable */}
      {showReviews && (
        <div className="px-5 pb-4">
          <ReviewsPanel driver={driver} />
        </div>
      )}

      {editOpen && (
        <EditDriverModal
          driver={driver}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}

export default DriversList;
