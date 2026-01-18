"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import PaymentStatusCard from "./PaymentStatusCard";
import { useTourPaymentStatus } from "@/src/hooks/tours/useTourPaymentStatus";

export default function PaymentFailure() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");
  const { isLoading, paymentDetails, error } = useTourPaymentStatus(orderId);

  const isCompleted =
    paymentDetails?.success === true &&
    (paymentDetails.status === "completed" ||
      paymentDetails.status === "PAID") &&
    (paymentDetails.payment_response?.code === "100" ||
      paymentDetails.payment_response?.is_successful === true);

  useEffect(() => {
    if (isCompleted && !isLoading) {
      router.replace(`/payment/success?order_id=${orderId}`);
    }
  }, [isCompleted, isLoading, orderId, router]);

  const isPending =
    !isLoading &&
    paymentDetails &&
    (paymentDetails.status === "PENDING" ||
      paymentDetails.status === "pending");

  if (isCompleted) {
    return null;
  }

  return (
    <div className="relative">
      <PaymentStatusCard
        isLoading={isLoading}
        paymentDetails={paymentDetails}
        error={error}
        completed={false}
      />

      {isPending && !isLoading && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-xl p-4 border-2 border-yellow-200 animate-fade-in z-50">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Payment not completed
              </p>
              <p className="text-xs text-gray-500">
                The payment was cancelled or not submitted
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
