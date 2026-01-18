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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          color: "text-yellow-700 bg-yellow-50 border-yellow-200",
          icon: AlertTriangle,
          text: "მუშავდება",
        };
      case "confirmed":
        return {
          color: "text-green-700 bg-green-50 border-green-200",
          icon: CheckCircle,
          text: "დადასტურებული",
        };
      case "cancelled":
        return {
          color: "text-red-700 bg-red-50 border-red-200",
          icon: XCircle,
          text: "გაუქმებული",
        };
      case "failed":
        return {
          color: "text-red-700 bg-red-50 border-red-200",
          icon: XCircle,
          text: "წარუმატებელი",
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
      "ka-GE",
      { year: "numeric", month: "long", day: "numeric" }
    );
    const statusConfig = getStatusConfig(data.status);
    const StatusIcon = statusConfig.icon;
    const amountRemaining = calculateAmountRemaining(data);

    return (
      <Card
        key={data.id}
        className="hover:shadow-lg transition-all duration-200 border border-gray-200"
      >
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="space-y-3 pb-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">
                {data.tourName}
              </h3>
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium w-fit ${statusConfig.color}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusConfig.text}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              შეკვეთის ID: #{data.id.slice(-8)}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-wide text-gray-500">
              მომხმარებლის ინფორმაცია
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-900 font-medium">
                    {data.customerFirstName} {data.customerLastName}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-700 truncate block">
                    {data.customerEmail}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-700">
                    {data.customerPhone}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h4 className="font-semibold text-xs uppercase tracking-wide text-gray-500">
              ტურის დეტალები
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">თარიღი</div>
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
                  <div className="text-xs text-gray-500">ადამიანები</div>
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
                  <div className="text-xs text-gray-500">ხანგრძლივობა</div>
                  <div className="text-sm font-medium text-gray-900">
                    {data.tourDurationDays} დღე
                    {data.tourDurationNights > 0 &&
                      ` / ${data.tourDurationNights} ღამე`}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">გადახდის ტიპი</div>
                  <div className="text-sm font-medium text-gray-900">
                    {data.isFullPayment ? "სრული" : "ნაწილობრივი"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h4 className="font-semibold text-xs uppercase tracking-wide text-gray-500">
              გადახდა
            </h4>
            <div className="space-y-2 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">სრული თანხა:</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  ₾{data.totalTourPrice}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">გადახდილი:</span>
                </div>
                <span className="text-sm font-bold text-green-600">
                  ₾{data.amountPaid}
                </span>
              </div>

              {amountRemaining > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-gray-600">დარჩენილი:</span>
                  </div>
                  <span className="text-sm font-bold text-orange-600">
                    ₾{amountRemaining}
                  </span>
                </div>
              )}

              {amountRemaining === 0 && data.status === "confirmed" && (
                <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    გადახდა დასრულებულია
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            ტურების შეკვეთები
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            სულ: {orders.length} შეკვეთა
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
            <span className="text-sm">განახლება</span>
          </Button>
          <Button
            onClick={handleDeleteFailed}
            variant="outline"
            className="flex-1 sm:flex-none hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <XCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">წაშლა</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-6">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-gray-600">შეკვეთების ჩატვირთვა...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              შეკვეთების ჩატვირთვა ვერ მოხერხდა
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={() => fetchOrders(pagination.currentPage)}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              თავიდან ცდა
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
              შეკვეთები არ მოიძებნა
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
                წინა
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
                შემდეგი
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TourOrdersList;
