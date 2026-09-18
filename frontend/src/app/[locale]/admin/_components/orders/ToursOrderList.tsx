"use client";

import React from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  CalendarDays,
  PersonStanding,
  Timer,
  Wallet,
  User,
  Phone,
  Mail,
  RefreshCw,
  AlertCircle,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
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
import { useTourOrders } from "@/src/hooks/tours/useTourOrders";

const TourOrdersList = () => {
  const {
    orders,
    pagination,
    loading,
    error,
    handlePageChange,
    handleDeleteFailed,
    calculateAmountRemaining,
    getPageNumbers,
    fetchOrders,
  } = useTourOrders();
  const t = useTranslations("admin");
  const locale = useLocale();

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return {
          color: "text-yellow-700 bg-yellow-50 border-yellow-200",
          icon: AlertTriangle,
          text: t("status.processing"),
        };
      case "paid":
      case "confirmed":
        return {
          color: "text-green-700 bg-green-50 border-green-200",
          icon: CheckCircle,
          text: t("status.paid"),
        };
      case "refunded":
        return {
          color: "text-blue-700 bg-blue-50 border-blue-200",
          icon: AlertCircle,
          text: t("status.refunded"),
        };
      case "cancelled":
        return {
          color: "text-red-700 bg-red-50 border-red-200",
          icon: XCircle,
          text: t("status.cancelled"),
        };
      case "failed":
        return {
          color: "text-red-700 bg-red-50 border-red-200",
          icon: XCircle,
          text: t("status.failed"),
        };
      default:
        return {
          color: "text-gray-700 bg-gray-50 border-gray-200",
          icon: AlertCircle,
          text: status.toUpperCase(),
        };
    }
  };

  const renderOrderCard = (data: (typeof orders)[number]) => {
    const formattedDate = new Date(data.selectedDate).toLocaleDateString(
      locale,
      { year: "numeric", month: "long", day: "numeric" }
    );
    const statusConfig = getStatusConfig(data.status);
    const StatusIcon = statusConfig.icon;
    const amountRemaining = calculateAmountRemaining(data);

    return (
      <Card
        key={data.id}
        className="shadow-sm hover:shadow-lg transition-shadow duration-200 border border-gray-200"
      >
        <CardContent className="p-4 sm:p-5 space-y-3">
          {/* Always-visible summary */}
          <div className="space-y-2 pb-3 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">
                {data.tourName}
              </h3>
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium w-fit shrink-0 ${statusConfig.color}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusConfig.text}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
                {data.customerFirstName} {data.customerLastName}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1.5 font-medium text-green-700">
                <Wallet className="w-3.5 h-3.5" />₾{data.amountPaid}
                {amountRemaining > 0 && (
                  <span className="text-orange-600 font-normal">
                    (+₾{amountRemaining})
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Collapsed details */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-brand-green select-none list-none [&::-webkit-details-marker]:hidden">
              <span>{t("common.details")}</span>
              <span className="text-xs text-gray-400 group-open:hidden">
                {t("tourOrders.expand")}
              </span>
              <span className="text-xs text-gray-400 hidden group-open:inline">
                {t("tourOrders.collapse")}
              </span>
            </summary>
            <div className="mt-3 space-y-4">
          <p className="text-xs text-gray-500">
            {t("common.orderId", { id: `#${data.id.slice(-8)}` })}
          </p>

          {["failed", "cancelled"].includes(data.status?.toLowerCase()) &&
            data.rejectionReason && (
              <p className="text-xs text-red-600 leading-snug">
                {t("tourOrders.failureReason", {
                  reason: data.rejectionReason,
                })}
              </p>
            )}

          <div className="space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-wide text-gray-500">
              {t("tourOrders.customerInfo")}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={`mailto:${data.customerEmail}`}
                    className="text-sm text-gray-700 truncate block hover:text-brand-green"
                  >
                    {data.customerEmail}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={`tel:${data.customerPhone}`}
                    className="text-sm text-gray-700 hover:text-brand-green"
                  >
                    {data.customerPhone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h4 className="font-semibold text-xs uppercase tracking-wide text-gray-500">
              {t("tourOrders.tourDetails")}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">{t("common.date")}</div>
                  <div className="text-sm font-medium text-gray-900">
                    {formattedDate}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <PersonStanding className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">{t("common.people")}</div>
                  <div className="text-sm font-medium text-gray-900">
                    {data.peopleAmount}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <Timer className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">{t("common.duration")}</div>
                  <div className="text-sm font-medium text-gray-900">
                    {t("common.days", { count: data.tourDurationDays })}
                    {data.tourDurationNights > 0 &&
                      ` / ${t("common.nights", { count: data.tourDurationNights })}`}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">{t("tourOrders.paymentType")}</div>
                  <div className="text-sm font-medium text-gray-900">
                    {data.isFullPayment
                      ? t("tourOrders.fullPayment")
                      : t("tourOrders.partialPayment")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h4 className="font-semibold text-xs uppercase tracking-wide text-gray-500">
              {t("common.payment")}
            </h4>
            <div className="space-y-2 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{t("tourOrders.totalAmount")}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ₾{data.totalTourPrice}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">{t("tourOrders.paid")}</span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  ₾{data.amountPaid}
                </span>
              </div>

              {amountRemaining > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-gray-600">{t("tourOrders.remaining")}</span>
                  </div>
                  <span className="text-sm font-medium text-orange-600">
                    ₾{amountRemaining}
                  </span>
                </div>
              )}

              {amountRemaining === 0 && data.status === "confirmed" && (
                <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    {t("tourOrders.paymentCompleted")}
                  </span>
                </div>
              )}
            </div>
          </div>
            </div>
          </details>
        </CardContent>
      </Card>
    );
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900">
            {t("tourOrders.title")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("common.totalOrders", { count: orders.length })}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={() => fetchOrders(pagination.currentPage)}
            variant="outline"
            className="flex-1 sm:flex-none"
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            <span className="text-sm">{t("common.refresh")}</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                disabled={loading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">{t("common.deleteFailedOrders")}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("common.deleteFailedOrdersTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("tourOrders.deleteFailedConfirm")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    handleDeleteFailed().then(() => {
                      toast.success(t("common.failedOrdersDeleted"));
                    }).catch(() => {
                      toast.error(t("common.deleteFailed"));
                    });
                  }}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {t("common.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-6">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-gray-600">{t("tourOrders.loadingOrders")}</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {t("common.ordersLoadFailed")}
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={() => fetchOrders(pagination.currentPage)}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-6">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <CalendarDays className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-base sm:text-lg text-center">
              {t("common.noOrdersFound")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {orders.map(renderOrderCard)}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
              >
                {t("common.previous")}
              </Button>

              <div className="flex gap-1">
                {pageNumbers.map((page, index) =>
                  page < 0 ? (
                    <span
                      key={index}
                      className="px-2 py-1 text-gray-400 text-sm"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={
                        pagination.currentPage === page ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="min-w-[2rem]"
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                {t("common.next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TourOrdersList;
