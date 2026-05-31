"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Star, MessageSquare, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import ToursSectionLoader from "@/src/components/shared/loader/ToursSectionLoader";
import { driversAPI, Driver, DriverReview } from "@/src/services/drivers.service";

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const cls = size === "sm" ? "h-4 w-4" : "h-6 w-6";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? "cursor-default" : "cursor-pointer"}
        >
          <Star
            className={`${cls} transition-colors ${
              star <= (hovered || value)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: DriverReview }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-800">{review.reviewerName}</span>
        <StarRating value={review.rating} readonly size="sm" />
      </div>
      {review.comment && (
        <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
      )}
      <p className="text-xs text-gray-400 mt-1">
        {new Date(review.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}

function DriverReviewsSection({ driver }: { driver: Driver }) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations("transfers");

  const { data, isLoading } = useQuery({
    queryKey: ["driver-reviews", driver.id],
    queryFn: () => driversAPI.getReviews(driver.id),
    enabled: expanded,
    staleTime: 1000 * 60 * 2,
  });

  const reviews = data?.data?.reviews || driver.recentReviews || [];

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mt-2"
      >
        <ChevronDown className="h-4 w-4" />
        {t("showReviews")} ({driver.totalReviews})
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <button
        type="button"
        onClick={() => setExpanded(false)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ChevronUp className="h-4 w-4" />
        {t("hideReviews")}
      </button>
      {isLoading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-2">{t("noReviewsYet")}</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
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
      driversAPI.createReview(driver.id, { rating, comment: comment || undefined, reviewerName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["driver-reviews", driver.id] });
      onClose();
      setRating(0);
      setComment("");
      setReviewerName("");
      setError("");
    },
    onError: () => {
      setError(t("reviewSubmitError"));
    },
  });

  const handleSubmit = () => {
    if (!reviewerName.trim()) { setError(t("reviewerNameRequired")); return; }
    if (rating === 0) { setError(t("ratingRequired")); return; }
    setError("");
    mutate();
  };

  const handleClose = () => {
    if (isPending) return;
    onClose();
    setRating(0);
    setComment("");
    setReviewerName("");
    setError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("leaveReview")} — {driver.firstName} {driver.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("yourName")} <span className="text-red-400">*</span></Label>
            <Input
              value={reviewerName}
              onChange={(e) => { setReviewerName(e.target.value); setError(""); }}
              placeholder={t("yourNamePlaceholder")}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("rating")} <span className="text-red-400">*</span></Label>
            <StarRating value={rating} onChange={(v) => { setRating(v); setError(""); }} />
          </div>

          <div className="space-y-2">
            <Label>
              {t("comment")}{" "}
              <span className="text-gray-400 text-xs font-normal">({t("optional")})</span>
            </Label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isPending}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-sm"
              placeholder={t("commentPlaceholder")}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t("submitting")}</>
            ) : (
              t("submitReview")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Drivers() {
  const t = useTranslations("transfers");
  const [reviewModalDriver, setReviewModalDriver] = useState<Driver | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => driversAPI.get(),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return <ToursSectionLoader />;
  if (error instanceof Error) return <p>Error: {error.message}</p>;

  const drivers = data?.data ?? [];
  if (drivers.length === 0) return null;

  return (
    <div className="px-4 md:px-20 pb-10">
      <h2 className="text-3xl font-bold mb-6 text-center">{t("ourDrivers")}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {drivers.map((driver: Driver) => (
          <Card key={driver.id} className="overflow-hidden bg-white border border-brand-green-100 shadow-xl">
            <CardHeader className="text-center pb-2">
              <Image
                src={
                  driver.photo
                    ? `${process.env.NEXT_PUBLIC_BASE_URL}${driver.photo}`
                    : "/images/driver-placeholder.jpg"
                }
                alt={`${driver.firstName} ${driver.lastName}`}
                className="rounded-full w-48 h-48 mx-auto mb-4 object-cover"
                width={192}
                height={192}
              />
              <CardTitle className="text-xl">
                {driver.firstName} {driver.lastName}
              </CardTitle>

              {driver.averageRating !== null && (
                <div className="flex items-center justify-center gap-2 mt-1">
                  <StarRating value={Math.round(driver.averageRating)} readonly size="sm" />
                  <span className="text-sm text-gray-600">
                    {driver.averageRating} ({driver.totalReviews})
                  </span>
                </div>
              )}
            </CardHeader>

            <CardContent className="pt-0 px-4 pb-4">
              <DriverReviewsSection driver={driver} />

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 border-orange-300 text-orange-600 hover:bg-orange-50"
                onClick={() => setReviewModalDriver(driver)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {t("writeReview")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {reviewModalDriver && (
        <WriteReviewModal
          driver={reviewModalDriver}
          isOpen={!!reviewModalDriver}
          onClose={() => setReviewModalDriver(null)}
        />
      )}
    </div>
  );
}
