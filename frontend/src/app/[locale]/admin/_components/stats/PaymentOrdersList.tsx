"use client";

import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Loader2,
  Info,
  User,
} from "lucide-react";
import {
  usePaymentOrders,
  PaymentType,
  PaymentStatus,
} from "@/src/hooks/payment-stats/usePaymentStats";

// Labels come from admin.paymentTypes.<type>
const TYPE_META: Record<PaymentType, { color: string }> = {
  tours: { color: "#2a78d6" },
  transfers: { color: "#1baf7a" },
  quick: { color: "#eda100" },
  insurance: { color: "#008300" },
};

const TYPE_ORDER: PaymentType[] = ["tours", "transfers", "quick", "insurance"];

const STATUS_OPTIONS: { value: PaymentStatus | ""; labelKey: string }[] = [
  { value: "", labelKey: "common.allStatuses" },
  { value: "PAID", labelKey: "status.paid" },
  { value: "FAILED", labelKey: "status.failed" },
  { value: "PENDING", labelKey: "status.pending" },
  { value: "REFUNDED", labelKey: "status.refunded" },
];

const formatMoney = (value: number) =>
  `₾${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDateTime = (iso: string, locale: string) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    time: d.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

const StatusBadge = ({ status }: { status: PaymentStatus }) => {
  const t = useTranslations("admin");
  switch (status) {
    case "PAID":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle size={13} />
          {t("status.paid")}
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle size={13} />
          {t("status.failed")}
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock size={13} />
          {t("status.pending")}
        </span>
      );
    case "REFUNDED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <RotateCcw size={13} />
          {t("status.refunded")}
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
};

const ReasonInfo = ({ reason }: { reason: string | null }) => {
  if (!reason) return null;
  return (
    <span className="group relative inline-flex">
      <Info className="w-4 h-4 text-red-400 cursor-help" />
      <span className="hidden group-hover:block absolute right-0 top-full mt-1.5 z-20 w-64 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-normal text-left">
        {reason}
      </span>
    </span>
  );
};

export const PaymentOrdersList = () => {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [typeFilter, setTypeFilter] = useState<PaymentType | undefined>(
    undefined
  );
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>(
    undefined
  );
  const [page, setPage] = useState(1);

  const { data, isLoading } = usePaymentOrders(
    typeFilter,
    statusFilter,
    page,
    20
  );

  const orders = data?.data || [];
  const pagination = data?.pagination;

  const setType = (type: PaymentType | undefined) => {
    setTypeFilter(type);
    setPage(1);
  };

  const setStatus = (status: PaymentStatus | undefined) => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t("paymentOrders.title")}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {pagination
            ? t("paymentOrders.totalPayments", { count: pagination.total })
            : t("paymentOrders.totalPaymentsLoading")}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap rounded-xl border border-gray-200 bg-white p-1 gap-0.5">
          <button
            onClick={() => setType(undefined)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !typeFilter
                ? "bg-brand-green text-white"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t("common.all")}
          </button>
          {TYPE_ORDER.map((type) => (
            <button
              key={type}
              onClick={() => setType(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === type
                  ? "bg-brand-green text-white"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ backgroundColor: TYPE_META[type].color }}
              />
              {t(`paymentTypes.${type}`)}
            </button>
          ))}
        </div>

        <select
          value={statusFilter || ""}
          onChange={(e) =>
            setStatus((e.target.value || undefined) as PaymentStatus | undefined)
          }
          className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-green/30"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-brand-green" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-center py-16 text-gray-400 text-sm">
            {t("paymentOrders.noPayments")}
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      {t("common.date")}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      {t("common.type")}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      {t("common.client")}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      {t("common.amount")}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      {t("common.status")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order, i) => {
                    const dt = formatDateTime(order.date, locale);
                    return (
                      <tr
                        key={`${order.externalOrderId}-${i}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                          <div className="font-medium">{dt.date}</div>
                          <div className="text-xs text-gray-400">{dt.time}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-1.5 text-sm text-gray-700">
                            <span
                              className="w-2 h-2 rounded-sm shrink-0"
                              style={{
                                backgroundColor:
                                  TYPE_META[order.type]?.color ?? "#999",
                              }}
                            />
                            {TYPE_META[order.type]
                              ? t(`paymentTypes.${order.type}`)
                              : order.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[220px]">
                              {order.customer}
                            </p>
                            <p
                              className="text-[10px] text-gray-400 font-mono"
                              title={order.externalOrderId}
                            >
                              #{order.externalOrderId?.slice(-8)}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                            {formatMoney(order.amount)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={order.status} />
                            {order.status === "FAILED" && (
                              <ReasonInfo reason={order.reason} />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {orders.map((order, i) => {
                const dt = formatDateTime(order.date, locale);
                return (
                  <div key={`${order.externalOrderId}-${i}`} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {order.customer}
                        </p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span
                          className="w-2 h-2 rounded-sm shrink-0"
                          style={{
                            backgroundColor:
                              TYPE_META[order.type]?.color ?? "#999",
                          }}
                        />
                        {TYPE_META[order.type]
                          ? t(`paymentTypes.${order.type}`)
                          : order.type}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatMoney(order.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {dt.date} {dt.time}
                    </p>
                    {order.status === "FAILED" && order.reason && (
                      <details className="mt-1.5">
                        <summary className="text-xs text-red-500 font-medium cursor-pointer select-none">
                          {t("common.viewReason")}
                        </summary>
                        <p className="text-xs text-red-600 leading-snug mt-1">
                          {order.reason}
                        </p>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-t">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 sm:px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {t("common.previous")}
                </button>
                <span className="text-xs sm:text-sm text-gray-600">
                  {t("common.pageOf", {
                    page: pagination.page,
                    total: pagination.totalPages,
                  })}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="px-3 sm:px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {t("common.next")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentOrdersList;
