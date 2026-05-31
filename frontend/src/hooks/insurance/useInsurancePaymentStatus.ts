import { useState, useEffect } from "react";

export interface InsurancePaymentDetails {
  id: string;
  externalOrderId: string;
  status: "PENDING" | "PAID" | "FAILED";
  submitterEmail: string;
  peopleCount: number;
  totalAmount: number;
  totalDays: number;
  people: Array<{
    fullName: string;
    phoneNumber: string;
    startDate: string;
    endDate: string;
    days: number;
    pricePerDay: number;
    baseAmount: number;
    discount: number;
    finalAmount: number;
  }>;
  paidAt?: string;
  createdAt: string;
}

export function useInsurancePaymentStatus(externalOrderId: string | null) {
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] =
    useState<InsurancePaymentDetails | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!externalOrderId) {
      setError("No order ID provided");
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let pollCount = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const MAX_POLLS = 20;

    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/insurance/status/${externalOrderId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch payment status");
        }

        const result = await response.json();

        if (!isMounted) return;

        if (result.success) {
          setPaymentDetails(result.data);

          if (result.data.status === "PAID" || result.data.status === "FAILED") {
            setIsLoading(false);
          } else if (pollCount < MAX_POLLS) {
            pollCount++;
            timeoutId = setTimeout(fetchStatus, 3000);
          } else {
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
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [externalOrderId]);

  return { isLoading, paymentDetails, error };
}
