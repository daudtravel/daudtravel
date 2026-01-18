"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ArrowLeft,
  User,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter, usePathname } from "next/navigation";
import { useQuickPaymentOrders } from "@/src/hooks/quick-payment/useQuickPayment";

export const QuickPaymentOrders = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );

  const { data: ordersData, isLoading } = useQuickPaymentOrders(
    undefined,
    statusFilter,
    page,
    50
  );

  const orders = ordersData?.data || [];
  const pagination = ordersData?.pagination;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={14} />
            გადახდილი
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock size={14} />
            მიმდინარე
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle size={14} />
            წარუმატებელი
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`${pathname}?quickPayment=all`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">შეკვეთები</h2>
                <p className="text-gray-600 text-sm mt-1">
                  სულ: {pagination?.total || 0} შეკვეთა
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter || ""}
                onChange={(e) => setStatusFilter(e.target.value || undefined)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ყველა სტატუსი</option>
                <option value="PAID">გადახდილი</option>
                <option value="PENDING">მიმდინარე</option>
                <option value="FAILED">წარუმატებელი</option>
              </select>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">შეკვეთები არ მოიძებნა</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      კლიენტი
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      პროდუქტი
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      თანხა
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      სტატუსი
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      შეკვეთის ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      თარიღი
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {order.customerFullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {order.linkImage ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_BASE_URL}${order.linkImage}`}
                              alt={order.productName}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {order.productName}
                            </p>
                            {order.productDescription && (
                              <p className="text-xs text-gray-500 truncate max-w-xs">
                                {order.productDescription}
                              </p>
                            )}
                            {order.linkSlug && (
                              <p className="text-xs text-blue-500">
                                /{order.linkSlug}
                              </p>
                            )}
                            {!order.linkSlug &&
                              order.linkName === "Deleted Link" && (
                                <p className="text-xs text-red-500">
                                  ლინკი წაშლილია
                                </p>
                              )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-semibold text-gray-900">
                          ₾{order.productPrice.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {order.externalOrderId}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.paidAt ? (
                          <div>
                            <div className="font-medium">
                              {format(new Date(order.paidAt), "dd/MM/yyyy")}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(order.paidAt), "HH:mm")}
                            </div>
                          </div>
                        ) : order.failedAt ? (
                          <div>
                            <div className="font-medium text-red-600">
                              {format(new Date(order.failedAt), "dd/MM/yyyy")}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(order.failedAt), "HH:mm")}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">
                              {format(new Date(order.createdAt), "dd/MM/yyyy")}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(order.createdAt), "HH:mm")}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  წინა
                </button>
                <span className="text-sm text-gray-600">
                  გვერდი {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  შემდეგი
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
