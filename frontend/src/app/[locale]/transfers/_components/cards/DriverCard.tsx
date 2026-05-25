"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { StarRating } from "../shared/StarRating";
import { driversAPI, Driver, DriverReview } from "@/src/services/drivers.service";

function ReviewCard({ review }: { review: DriverReview }) {
  return (
    <div className="p-3 bg-brand-green-50 rounded-xl border border-brand-green-100">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-brand-green">{review.reviewerName}</span>
        <StarRating value={review.rating} readonly size="xs" />
      </div>
      {review.comment && (
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{review.comment}</p>
      )}
      <p className="text-xs text-gray-400 mt-1.5">
        {new Date(review.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}

function ReviewsPanel({ driver }: { driver: Driver }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("transfers");

  const { data, isLoading } = useQuery({
    queryKey: ["driver-reviews", driver.id],
    queryFn: () => driversAPI.getReviews(driver.id),
    enabled: open,
    staleTime: 1000 * 60 * 2,
  });

  const reviews = data?.data?.reviews || driver.recentReviews || [];

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-brand-green-mid hover:text-brand-green font-medium transition-colors"
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {open ? t("hideReviews") : `${t("showReviews")} (${driver.totalReviews})`}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-brand-green-mid" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">{t("noReviewsYet")}</p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WriteReviewModal({
  driver,
  isOpen,
  onClose,
}: {
  driver: Driver;
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("transfers");
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [error, setError] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      driversAPI.createReview(driver.id, {
        rating,
        comment: comment.trim() || undefined,
        reviewerName: reviewerName.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["driver-reviews", driver.id] });
      setRating(0);
      setComment("");
      setReviewerName("");
      setError("");
      onClose();
    },
    onError: () => setError(t("reviewSubmitError")),
  });

  const submit = () => {
    if (!reviewerName.trim()) { setError(t("reviewerNameRequired")); return; }
    if (rating === 0) { setError(t("ratingRequired")); return; }
    setError("");
    mutate();
  };

  const close = () => {
    if (isPending) return;
    setRating(0); setComment(""); setReviewerName(""); setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-brand-green">
            {t("leaveReview")} — {driver.firstName} {driver.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              {t("yourName")} <span className="text-red-400">*</span>
            </Label>
            <Input
              value={reviewerName}
              onChange={(e) => { setReviewerName(e.target.value); setError(""); }}
              placeholder={t("yourNamePlaceholder")}
              disabled={isPending}
              className="border-gray-200 focus-visible:ring-brand-green"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              {t("rating")} <span className="text-red-400">*</span>
            </Label>
            <StarRating value={rating} onChange={(v) => { setRating(v); setError(""); }} size="md" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              {t("comment")}{" "}
              <span className="text-gray-400 text-xs font-normal">({t("optional")})</span>
            </Label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isPending}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green resize-none text-sm"
              placeholder={t("commentPlaceholder")}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <button
            onClick={close}
            disabled={isPending}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            onClick={submit}
            disabled={isPending}
            className="flex-1 px-4 py-2 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{t("submitting")}</>
            ) : (
              t("submitReview")
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DriverCardProps {
  driver: Driver;
}

export function DriverCard({ driver }: DriverCardProps) {
  const t = useTranslations("transfers");
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="h-1 bg-brand-yellow" />

      <div className="p-5 flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative w-24 h-24 mb-3">
          <Image
            src={
              driver.photo
                ? `${process.env.NEXT_PUBLIC_BASE_URL}${driver.photo}`
                : "/images/driver-placeholder.jpg"
            }
            alt={`${driver.firstName} ${driver.lastName}`}
            fill
            className="rounded-full object-cover ring-4 ring-brand-green-100"
          />
          {driver.averageRating !== null && driver.averageRating >= 4.5 && (
            <span className="absolute -bottom-1 -right-1 bg-brand-yellow text-brand-green text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
              TOP
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-bold text-gray-900 text-base">
          {driver.firstName} {driver.lastName}
        </h3>

        {/* Rating */}
        {driver.averageRating !== null ? (
          <div className="flex items-center gap-1.5 mt-1">
            <StarRating value={Math.round(driver.averageRating)} readonly size="xs" />
            <span className="text-xs text-gray-500 font-medium">
              {driver.averageRating} ({driver.totalReviews})
            </span>
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-1">{t("noReviewsYet")}</p>
        )}

        {/* Reviews toggle */}
        {driver.totalReviews > 0 && <ReviewsPanel driver={driver} />}

        {/* Write review */}
        <button
          type="button"
          onClick={() => setReviewOpen(true)}
          className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-brand-green border border-brand-green/30 hover:bg-brand-green-50 px-4 py-2 rounded-xl transition-colors w-full justify-center"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {t("writeReview")}
        </button>
      </div>

      <WriteReviewModal
        driver={driver}
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
      />
    </div>
  );
}
