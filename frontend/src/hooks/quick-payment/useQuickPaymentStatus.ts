import { useState, useEffect } from "react";

export interface QuickPaymentStatusResponse {
  success: boolean;
  data: {
    id: string;
    status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
    customerFullName: string;
    productName: string;
    productDescription?: string;
    productPrice: number;
    paidAt?: string;
    createdAt: string;
  };
}

export function useQuickPaymentStatus(externalOrderId: string | null) {
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<
    QuickPaymentStatusResponse["data"] | null
  >(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!externalOrderId) {
      setError("No order ID provided");
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let pollCount = 0;
    const MAX_POLLS = 20; // 20 seconds max polling

    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/quick-payment/status/${externalOrderId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch payment status");
        }

        const result: QuickPaymentStatusResponse = await response.json();

        if (isMounted && result.success) {
          setPaymentDetails(result.data);

          // Stop polling if payment is complete or failed
          if (
            result.data.status === "PAID" ||
            result.data.status === "FAILED"
          ) {
            setIsLoading(false);
          } else if (pollCount < MAX_POLLS) {
            // Continue polling for pending status
            pollCount++;
            setTimeout(fetchStatus, 1000);
          } else {
            // Max polls reached
            setIsLoading(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setIsLoading(false);
        }
      }
    };

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, [externalOrderId]);

  return { isLoading, paymentDetails, error };
}
