"use client";

import { PaymentStatusResponse } from "@/src/app/[locale]/payment/types";
import { useState, useEffect, useCallback } from "react";

export const useTransferPaymentStatus = (orderId: string | null) => {
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] =
    useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState<string>("");

  const fetchPaymentStatus = useCallback(async () => {
    if (!orderId) {
      setError("No order ID provided");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/bog/transfer/status/${orderId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data: PaymentStatusResponse = await response.json();

      if (!response.ok) {
        // Handle HTTP errors but still process the response data
        if (response.status === 404) {
          setError(data.message || "Payment not found");
        } else if (response.status === 500) {
          setError(data.message || "Server error occurred");
        } else {
          setError(data.message || `HTTP error! status: ${response.status}`);
        }

        // Still set payment details if available for failed payments
        if (data && typeof data === "object") {
          setPaymentDetails(data);
        }
      } else {
        // Success response
        setPaymentDetails(data);

        // Additional validation
        if (!data.success) {
          setError(data.message || "Payment verification failed");
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error verifying payment";
      setError(errorMessage);
      console.error("Payment verification error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchPaymentStatus();
  }, [fetchPaymentStatus]);

  return {
    isLoading,
    paymentDetails,
    error,
    refetch: fetchPaymentStatus,
  };
};
