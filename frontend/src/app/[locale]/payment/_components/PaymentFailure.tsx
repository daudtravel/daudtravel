"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import PaymentStatusCard from "./PaymentStatusCard";
import { useTourPaymentStatus } from "@/src/hooks/tours/useTourPaymentStatus";
import { useQuickPaymentStatus } from "@/src/hooks/quick-payment/useQuickPaymentStatus";
import { useTransferPaymentStatus } from "@/src/hooks/transfers/useTransferPaymentStatus";
import { useInsurancePaymentStatus } from "@/src/hooks/insurance/useInsurancePaymentStatus";

type PaymentType = "tour" | "quick" | "transfer" | "insurance" | "unknown";

export default function PaymentFailure() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");

  // Determine payment type based on order_id prefix
  const getPaymentType = (): PaymentType => {
    if (!orderId) return "unknown";
    if (orderId.startsWith("TOUR_ORDER_")) return "tour";
    if (orderId.startsWith("QP_")) return "quick";
    if (orderId.startsWith("TRANSFER_ORDER_")) return "transfer";
    if (orderId.startsWith("INS_")) return "insurance";
    return "unknown";
  };

  const paymentType = getPaymentType();

  const tourPayment = useTourPaymentStatus(
    paymentType === "tour" ? orderId : null
  );
  const quickPayment = useQuickPaymentStatus(
    paymentType === "quick" ? orderId : null
  );
  const transferPayment = useTransferPaymentStatus(
    paymentType === "transfer" ? orderId : null
  );
  const insurancePayment = useInsurancePaymentStatus(
    paymentType === "insurance" ? orderId : null
  );

  const isLoading =
    paymentType === "tour"
      ? tourPayment.isLoading
      : paymentType === "quick"
        ? quickPayment.isLoading
        : paymentType === "transfer"
          ? transferPayment.isLoading
          : paymentType === "insurance"
            ? insurancePayment.isLoading
            : false;

  const error =
    paymentType === "tour"
      ? tourPayment.error
      : paymentType === "quick"
        ? quickPayment.error
        : paymentType === "transfer"
          ? transferPayment.error
          : paymentType === "insurance"
            ? insurancePayment.error
            : "Invalid order type";

  const tourPaymentDetails =
    paymentType === "tour" ? tourPayment.paymentDetails : null;
  const quickPaymentDetails =
    paymentType === "quick" ? quickPayment.paymentDetails : null;
  const transferPaymentDetails =
    paymentType === "transfer" ? transferPayment.paymentDetails : null;
  const insurancePaymentDetails =
    paymentType === "insurance" ? insurancePayment.paymentDetails : null;

  const isCompleted =
    paymentType === "tour"
      ? tourPaymentDetails?.success === true &&
        (tourPaymentDetails.status === "completed" ||
          tourPaymentDetails.status === "PAID")
      : paymentType === "quick"
        ? quickPaymentDetails?.status === "PAID"
        : paymentType === "transfer"
          ? transferPaymentDetails?.success === true &&
            (transferPaymentDetails.status === "completed" ||
              transferPaymentDetails.status === "PAID")
          : paymentType === "insurance"
            ? insurancePaymentDetails?.status === "PAID"
            : false;

  const isPending =
    paymentType === "tour"
      ? !isLoading &&
        tourPaymentDetails &&
        (tourPaymentDetails.status === "PENDING" ||
          tourPaymentDetails.status === "pending")
      : paymentType === "quick"
        ? !isLoading && quickPaymentDetails?.status === "PENDING"
        : paymentType === "transfer"
          ? !isLoading &&
            transferPaymentDetails &&
            (transferPaymentDetails.status === "PENDING" ||
              transferPaymentDetails.status === "pending")
          : paymentType === "insurance"
            ? !isLoading && insurancePaymentDetails?.status === "PENDING"
            : false;

  useEffect(() => {
    if (isCompleted && !isLoading) {
      router.replace(`/payment/success?order_id=${orderId}`);
    }
  }, [isCompleted, isLoading, orderId, router]);

  if (isCompleted) {
    return null;
  }

  return (
    <div className="relative">
      <PaymentStatusCard
        isLoading={isLoading}
        paymentDetails={tourPaymentDetails || transferPaymentDetails}
        quickPaymentDetails={quickPaymentDetails}
        insurancePaymentDetails={insurancePaymentDetails}
        error={error}
        completed={false}
        paymentType={paymentType}
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
