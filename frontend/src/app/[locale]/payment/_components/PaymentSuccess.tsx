"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PaymentStatusCard from "./PaymentStatusCard";
import { useTourPaymentStatus } from "@/src/hooks/tours/useTourPaymentStatus";

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");
  const { isLoading, paymentDetails, error } = useTourPaymentStatus(orderId);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  console.log(orderId);

  const isCompleted =
    paymentDetails?.success === true ||
    paymentDetails?.status === "PAID" ||
    paymentDetails?.status === "completed";

  const isFailed =
    !isLoading &&
    paymentDetails &&
    paymentDetails.success === false &&
    (paymentDetails.status === "FAILED" ||
      paymentDetails.status === "rejected" ||
      paymentDetails.status === "failed");

  const isPending =
    !isLoading &&
    paymentDetails &&
    paymentDetails.success === null &&
    (paymentDetails.status === "PENDING" ||
      paymentDetails.status === "pending");

  useEffect(() => {
    if (isFailed) {
      router.replace(`/payment/failure?order_id=${orderId}`);
    }
  }, [isFailed, orderId, router]);

  useEffect(() => {
    if (isCompleted && !isLoading && paymentDetails) {
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            const orderIdToFetch =
              paymentDetails.order_id ||
              paymentDetails.external_order_id ||
              orderId;

            if (paymentDetails.order_id) {
              router.push(`/tours/order/${paymentDetails.order_id}`);
            } else {
              router.push(`/tours/order/details?order_id=${orderIdToFetch}`);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isCompleted, isLoading, paymentDetails, orderId, router]);

  if (isFailed) {
    return null;
  }

  return (
    <div className="relative">
      <PaymentStatusCard
        isLoading={isLoading}
        paymentDetails={paymentDetails}
        error={error}
        completed={isCompleted}
      />

      {isCompleted && !isLoading && redirectCountdown > 0 && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-xl p-4 border-2 border-green-200 animate-fade-in z-50">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Redirecting to order details
              </p>
              <p className="text-xs text-gray-500">
                in {redirectCountdown} second
                {redirectCountdown !== 1 ? "s" : ""}...
              </p>
            </div>
            <button
              onClick={() => {
                const orderIdToFetch =
                  paymentDetails?.order_id ||
                  paymentDetails?.external_order_id ||
                  orderId;
                if (paymentDetails?.order_id) {
                  router.push(`/tours/order/${paymentDetails.order_id}`);
                } else {
                  router.push(
                    `/tours/order/details?order_id=${orderIdToFetch}`
                  );
                }
              }}
              className="ml-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Go now
            </button>
          </div>
        </div>
      )}

      {isPending && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-xl p-4 border-2 border-blue-200 animate-fade-in z-50">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg
                className="animate-spin h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Waiting for payment confirmation...
              </p>
              <p className="text-xs text-gray-500">
                Your payment is being verified
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
