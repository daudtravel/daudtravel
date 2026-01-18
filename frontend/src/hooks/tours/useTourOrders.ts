"use client";

import { useState, useEffect, useCallback } from "react";
import { ordersAPI } from "@/src/services/tours-orders.service";

export interface OrderData {
  id: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  peopleAmount: number;
  selectedDate: string;
  tourDurationDays: number;
  tourDurationNights: number;
  tourName: string;
  tourDescription?: string | null;
  startLocation?: string | null;
  endLocation?: string | null;
  locations?: string[];
  isFullPayment: boolean;
  totalTourPrice: number;
  amountPaid: number;
  amountRemaining?: number;
  externalOrderId: string;
  bogOrderId: string;
  status: string;
  paymentUrl?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const useTourOrders = (initialPage = 1) => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: initialPage,
    totalPages: 1,
    totalRecords: 0,
    limit: 6,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(
    async (page: number = initialPage) => {
      try {
        setLoading(true);
        setError(null);

        const result = await ordersAPI.get(page);

        if (result.success && Array.isArray(result.data)) {
          setOrders(result.data);
          if (result.pagination) setPagination(result.pagination);
        } else {
          setOrders([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    },
    [initialPage]
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) fetchOrders(page);
  };

  const handleDeleteFailed = async () => {
    if (!confirm("Are you sure you want to delete all failed orders?")) return;
    try {
      setLoading(true);
      await ordersAPI.deleteFailedOrders();
      await fetchOrders(pagination.currentPage);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete failed orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(pagination.currentPage);
  }, [fetchOrders, pagination.currentPage]);

  const calculateAmountRemaining = (order: OrderData) => {
    return order.amountRemaining ?? order.totalTourPrice - order.amountPaid;
  };

  const getPageNumbers = () => {
    const pageNumbers: number[] = [];
    const { totalPages, currentPage } = pagination;

    if (totalPages > 0) pageNumbers.push(1);

    if (totalPages > 5) {
      if (currentPage > 3) pageNumbers.push(-1);

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++)
        if (!pageNumbers.includes(i)) pageNumbers.push(i);

      if (currentPage < totalPages - 2) pageNumbers.push(-2);
      if (!pageNumbers.includes(totalPages)) pageNumbers.push(totalPages);
    } else {
      for (let i = 2; i <= totalPages; i++) pageNumbers.push(i);
    }

    return pageNumbers;
  };

  return {
    orders,
    pagination,
    loading,
    error,
    fetchOrders,
    handlePageChange,
    handleDeleteFailed,
    calculateAmountRemaining,
    getPageNumbers,
  };
};
