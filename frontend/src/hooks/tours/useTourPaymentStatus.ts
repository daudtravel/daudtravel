"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import type { PaymentStatusResponse } from "../../app/[locale]/payment/types";

export const useTourPaymentStatus = (orderId: string | null) => {
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] =
    useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState<string>("");
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const maxPolls = 15;
  const pollInterval = 2000;
  const t = useTranslations("payment.result");
  const tRef = useRef(t);
  tRef.current = t;

  const fetchPaymentStatus = useCallback(async () => {
    if (!orderId) {
      setError(tRef.current("noOrderId"));
      setIsLoading(false);
      return null;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/tours/payments/bog/status/${orderId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data: PaymentStatusResponse = await response.json();
      setPaymentDetails(data);

      const isPending =
        data.success === null ||
        data.status === "PENDING" ||
        data.status === "pending";

      if (!response.ok && !isPending) {
        const errorMsg = data.message || tRef.current("verificationFailed");
        setError(errorMsg);
      }

      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : tRef.current("verifyError");
      setError(errorMessage);
      return null;
    }
  }, [orderId]);

  const startPolling = useCallback(() => {
    pollIntervalRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      const data = await fetchPaymentStatus();

      if (data) {
        const isSuccess =
          data.success === true ||
          data.status === "PAID" ||
          data.status === "completed";

        const isFailed =
          data.success === false &&
          (data.status === "FAILED" ||
            data.status === "failed" ||
            data.status === "rejected");

        if (isSuccess || isFailed || pollCountRef.current >= maxPolls) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setIsLoading(false);

          if (pollCountRef.current >= maxPolls && data.success === null) {
            setError(tRef.current("takingLonger"));
          }
        }
      } else if (pollCountRef.current >= maxPolls) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsLoading(false);
        setError(tRef.current("couldNotVerify"));
      }
    }, pollInterval);
  }, [fetchPaymentStatus, maxPolls, pollInterval]);

  useEffect(() => {
    const initiateFetch = async () => {
      setIsLoading(true);
      const data = await fetchPaymentStatus();

      if (data) {
        const isSuccess =
          data.success === true ||
          data.status === "PAID" ||
          data.status === "completed";

        const isFailed =
          data.success === false &&
          (data.status === "FAILED" ||
            data.status === "failed" ||
            data.status === "rejected");

        if (isSuccess || isFailed) {
          setIsLoading(false);
        } else {
          startPolling();
        }
      } else {
        setIsLoading(false);
      }
    };

    initiateFetch();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [orderId, fetchPaymentStatus, startPolling]);

  return {
    isLoading,
    paymentDetails,
    error,
    refetch: fetchPaymentStatus,
  };
};
