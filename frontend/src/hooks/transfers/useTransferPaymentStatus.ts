"use client";

import { PaymentStatusResponse } from "@/src/app/[locale]/payment/types";
import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";

export const useTransferPaymentStatus = (orderId: string | null) => {
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] =
    useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState<string>("");
  const t = useTranslations("payment.result");
  const tPayment = useTranslations("payment");
  const tRef = useRef({ t, tPayment });
  tRef.current = { t, tPayment };

  const fetchPaymentStatus = useCallback(async () => {
    if (!orderId) {
      setError(tRef.current.t("noOrderId"));
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
          setError(data.message || tRef.current.t("paymentNotFound"));
        } else if (response.status === 500) {
          setError(data.message || tRef.current.t("serverError"));
        } else {
          setError(
            data.message ||
              tRef.current.tPayment("httpError", { status: response.status })
          );
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
          setError(data.message || tRef.current.t("verificationFailed"));
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : tRef.current.t("verifyError");
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
