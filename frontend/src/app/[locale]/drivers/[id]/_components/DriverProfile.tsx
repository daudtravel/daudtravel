"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  ArrowLeft,
  Languages,
  Car,
  MessageSquare,
  ImageIcon,
} from "lucide-react";
import { Link } from "@/src/i18n/routing";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { driversAPI, DriverReview } from "@/src/services/drivers.service";
import { StarRating } from "../../../transfers/_components/shared/StarRating";
import { WriteReviewModal } from "../../../transfers/_components/cards/DriverCard";

function ReviewItem({ review }: { review: DriverReview }) {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-brand-green">
          {review.reviewerName}
        </span>
        <StarRating value={review.rating} readonly size="xs" />
      </div>
      {review.comment && (
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
          {review.comment}
        </p>
      )}
      <p className="text-xs text-gray-400 mt-1.5">
        {new Date(review.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}

export default function DriverProfile({ driverId }: { driverId: string }) {
  const t = useTranslations("transfers");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["driver", driverId],
    queryFn: () => driversAPI.getById(driverId),
    staleTime: 1000 * 60 * 2,
  });

  const driver = data?.data;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-brand-green-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-mid" />
      </div>
    );
  }

  if (isError || !driver) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4 bg-brand-green-50 px-4">
        <p className="text-gray-500">{t("driverNotFound")}</p>
        <Link
          href="/transfers"
          className="flex items-center gap-2 text-sm font-medium text-brand-green hover:text-brand-green-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("backToTransfers")}
        </Link>
      </div>
    );
  }

  const fullName = `${driver.firstName} ${driver.lastName}`;
  const reviews = driver.recentReviews ?? [];

  return (
    <div className="bg-brand-green-50 min-h-screen px-4 md:px-20 py-8 md:py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          href="/transfers"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-green hover:text-brand-green-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("backToTransfers")}
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="h-1.5 bg-brand-yellow" />
          <div className="p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative w-28 h-28 md:w-36 md:h-36 shrink-0">
              <Image
                src={
                  driver.photo
                    ? `${process.env.NEXT_PUBLIC_BASE_URL}${driver.photo}`
                    : "/images/driver-placeholder.jpg"
                }
                alt={fullName}
                fill
                className="rounded-full object-cover ring-4 ring-brand-green-100"
              />
            </div>

            <div className="flex-1 text-center sm:text-start">
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
                {fullName}
              </h1>

              {driver.averageRating !== null ? (
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <StarRating
                    value={Math.round(driver.averageRating)}
                    readonly
                    size="sm"
                  />
                  <span className="text-sm text-gray-500 font-medium">
                    {driver.averageRating} ({driver.totalReviews})
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-400 mt-2">{t("noReviewsYet")}</p>
              )}

              {driver.languages.length > 0 && (
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-4 flex-wrap">
                  <Languages className="h-4 w-4 text-brand-green-mid shrink-0" />
                  {driver.languages.map((lang) => (
                    <span
                      key={lang}
                      className="px-3 py-1 bg-brand-green-50 text-brand-green text-xs font-medium rounded-full border border-brand-green-100"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              )}

              {driver.dailyRentPrice !== null && (
                <div className="inline-flex items-center gap-2 mt-4 bg-brand-green-50 border border-brand-green-100 rounded-xl px-4 py-2.5">
                  <Car className="h-5 w-5 text-brand-green" />
                  <span className="text-sm text-gray-600">
                    {t("dailyCarRent")}:
                  </span>
                  <span className="text-base font-bold text-brand-green">
                    ₾{driver.dailyRentPrice}
                  </span>
                  <span className="text-xs text-gray-400">/ {t("perDay")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Car photos */}
        {driver.carPhotos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-brand-green" />
              {t("carPhotos")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {driver.carPhotos.map((photo) => (
                <button
                  key={photo}
                  type="button"
                  onClick={() => setLightboxPhoto(photo)}
                  className="relative aspect-[4/3] rounded-xl overflow-hidden group"
                >
                  <Image
                    src={`${process.env.NEXT_PUBLIC_BASE_URL}${photo}`}
                    alt={`${fullName} — car`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-brand-green" />
              {t("reviews")} ({driver.totalReviews})
            </h2>
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-green hover:bg-brand-green-dark px-4 py-2 rounded-xl transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              {t("writeReview")}
            </button>
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {t("noReviewsYet")}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photo lightbox */}
      <Dialog
        open={!!lightboxPhoto}
        onOpenChange={(open) => !open && setLightboxPhoto(null)}
      >
        <DialogContent className="max-w-3xl p-2 bg-transparent border-none shadow-none">
          <DialogTitle className="sr-only">{t("carPhotos")}</DialogTitle>
          {lightboxPhoto && (
            <div className="relative w-full aspect-[4/3]">
              <Image
                src={`${process.env.NEXT_PUBLIC_BASE_URL}${lightboxPhoto}`}
                alt={`${fullName} — car`}
                fill
                className="object-contain rounded-xl"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <WriteReviewModal
        driver={driver}
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
      />
    </div>
  );
}
