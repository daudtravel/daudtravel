"use client";

import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  PersonStanding,
  Wallet,
  User,
  Phone,
  Mail,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Car,
  Route,
} from "lucide-react";
import { transferOrdersAPI } from "@/src/services/transfer-orders.service";
import {
  TransferOrder,
  useTransferOrders,
} from "@/src/hooks/transfers/useTransferOrders";

const TransferOrdersDashboard = () => {
  const queryClient = useQueryClient();

  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTransferOrders();

  const deleteFailedMutation = useMutation({
    mutationFn: () => transferOrdersAPI.deleteFailedOrders(),
    onSuccess: () => {
      alert("წარუმატებელი შეკვეთები წაიშალა");
      queryClient.invalidateQueries({ queryKey: ["admin", "transfer-orders"] });
    },
    onError: (err: any) => {
      alert(`წაშლა ვერ მოხერხდა: ${err?.message || "უცნობი შეცდომა"}`);
    },
  });

  const handleDeleteFailed = () => {
    if (!confirm("წაიშალოს ყველა წარუმატებელი ტრანსფერის შეკვეთა?")) return;
    deleteFailedMutation.mutate();
  };

  const getStatusConfig = (status: string) => {
    const s = status?.toUpperCase() ?? "UNKNOWN";
    const configs: Record<string, any> = {
      PENDING: {
        color: "text-yellow-700 bg-yellow-50 border-yellow-200",
        icon: AlertTriangle,
        text: "მუშავდება",
      },
      PAID: {
        color: "text-green-700 bg-green-50 border-green-200",
        icon: CheckCircle2,
        text: "გადახდილი",
      },
      FAILED: {
        color: "text-red-700 bg-red-50 border-red-200",
        icon: XCircle,
        text: "წარუმატებელი",
      },
      REFUNDED: {
        color: "text-purple-700 bg-purple-50 border-purple-200",
        icon: RefreshCw,
        text: "დაბრუნებული",
      },
    };
    return (
      configs[s] ?? {
        color: "text-gray-700 bg-gray-50 border-gray-200",
        icon: AlertCircle,
        text: s,
      }
    );
  };

  const renderOrderCard = (order: TransferOrder) => {
    const { date, time, vehicleType, passengerCount } = order.transfer;

    const transferDate = new Date(date).toLocaleDateString("ka-GE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const transferTime = new Date(time).toLocaleTimeString("ka-GE", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const expires = order.expiresAt
      ? new Date(order.expiresAt).toLocaleString("ka-GE")
      : "—";

    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;

    const route =
      order.route ||
      `${order.startLocation || "?"} → ${order.endLocation || "?"}`;
    const transferName =
      order.transferName ||
      `${order.startLocation || "აეროპორტი"} → ${order.endLocation || "ქალაქი"}`;

    return (
      <div
        key={order.id}
        className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200"
      >
        <div className="p-4 sm:p-5 space-y-4">
          <div className="space-y-3 pb-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">
                {transferName}
              </h3>
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium w-fit ${statusConfig.color}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusConfig.text}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              შეკვეთის ID: #{order.id.slice(-8)}
              {order.bogOrderId && ` • BOG: ${order.bogOrderId.slice(-8)}`}
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
                    {order.customer.fullName}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-700 truncate block">
                    {order.customer.email}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-700">
                    {order.customer.phone}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h4 className="font-semibold text-xs uppercase tracking-wide text-gray-500">
              ტრანსფერის დეტალები
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">თარიღი</div>
                  <div className="text-sm font-medium text-gray-900">
                    {transferDate}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">დრო</div>
                  <div className="text-sm font-medium text-gray-900">
                    {transferTime}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <PersonStanding className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">მგზავრები</div>
                  <div className="text-sm font-medium text-gray-900">
                    {passengerCount}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <Car className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">ავტომობილი</div>
                  <div className="text-sm font-medium text-gray-900">
                    {vehicleType}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 col-span-2">
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <Route className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">მარშრუტი</div>
                  <div className="text-sm font-medium text-gray-900">
                    {route}
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
                  <span className="text-sm text-gray-600">თანხა:</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {order.currency === "GEL" ? "₾" : order.currency}
                  {order.paymentAmount}
                </span>
              </div>

              {order.paymentUrl && (
                <a
                  href={order.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors"
                >
                  გადახდის ბმული
                </a>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
              <div>
                <span className="block text-gray-500">შექმნილია:</span>
                <span className="font-medium">
                  {new Date(order.createdAt).toLocaleString("ka-GE")}
                </span>
              </div>
              <div>
                <span className="block text-gray-500">განახლებულია:</span>
                <span className="font-medium">
                  {new Date(order.updatedAt).toLocaleString("ka-GE")}
                </span>
              </div>
              {order.expiresAt && (
                <div className="col-span-2">
                  <span className="block text-gray-500">ვადა:</span>
                  <span className="font-medium">{expires}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            ტრანსფერების შეკვეთები
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            სულ: {orders.length} შეკვეთა
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => refetch()}
            disabled={isLoading || deleteFailedMutation.isPending}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>განახლება</span>
          </button>
          <button
            onClick={handleDeleteFailed}
            disabled={isLoading || deleteFailedMutation.isPending}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-sm font-medium text-gray-700 disabled:opacity-50 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>წაშლა</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">შეკვეთების ჩატვირთვა...</p>
          </div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 rounded-lg shadow-sm border border-red-200">
          <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              შეკვეთების ჩატვირთვა ვერ მოხერხდა
            </h2>
            <p className="text-gray-600 mb-4">
              {(error as Error)?.message || "შეცდომა"}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              თავიდან ცდა
            </button>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-200">
          <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <Car className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-base sm:text-lg text-center">
              შეკვეთები არ მოიძებნა
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {orders.map(renderOrderCard)}
        </div>
      )}
    </div>
  );
};

export default TransferOrdersDashboard;
