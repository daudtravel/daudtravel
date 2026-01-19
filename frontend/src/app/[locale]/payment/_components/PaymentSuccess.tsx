"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import PaymentStatusCard from "./PaymentStatusCard";
import { useTourPaymentStatus } from "@/src/hooks/tours/useTourPaymentStatus";
import { useQuickPaymentStatus } from "@/src/hooks/quick-payment/useQuickPaymentStatus";
import { useTransferPaymentStatus } from "@/src/hooks/transfers/useTransferPaymentStatus";
import { useInsurancePaymentStatus } from "@/src/hooks/insurance/useInsurancePaymentStatus";

type PaymentType = "tour" | "quick" | "transfer" | "insurance" | "unknown";

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");

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
      ? tourPaymentDetails?.success === true ||
        tourPaymentDetails?.status === "PAID" ||
        tourPaymentDetails?.status === "completed"
      : paymentType === "quick"
        ? quickPaymentDetails?.status === "PAID"
        : paymentType === "transfer"
          ? transferPaymentDetails?.success === true ||
            transferPaymentDetails?.status === "PAID" ||
            transferPaymentDetails?.status === "completed"
          : paymentType === "insurance"
            ? insurancePaymentDetails?.status === "PAID"
            : false;

  const isFailed =
    paymentType === "tour"
      ? !isLoading &&
        tourPaymentDetails &&
        tourPaymentDetails.success === false &&
        (tourPaymentDetails.status === "FAILED" ||
          tourPaymentDetails.status === "rejected" ||
          tourPaymentDetails.status === "failed")
      : paymentType === "quick"
        ? quickPaymentDetails?.status === "FAILED"
        : paymentType === "transfer"
          ? !isLoading &&
            transferPaymentDetails &&
            transferPaymentDetails.success === false &&
            (transferPaymentDetails.status === "FAILED" ||
              transferPaymentDetails.status === "rejected" ||
              transferPaymentDetails.status === "failed")
          : paymentType === "insurance"
            ? insurancePaymentDetails?.status === "FAILED"
            : false;

  const isPending =
    paymentType === "tour"
      ? !isLoading &&
        tourPaymentDetails &&
        tourPaymentDetails.success === null &&
        (tourPaymentDetails.status === "PENDING" ||
          tourPaymentDetails.status === "pending")
      : paymentType === "quick"
        ? !isLoading && quickPaymentDetails?.status === "PENDING"
        : paymentType === "transfer"
          ? !isLoading &&
            transferPaymentDetails &&
            transferPaymentDetails.success === null &&
            (transferPaymentDetails.status === "PENDING" ||
              transferPaymentDetails.status === "pending")
          : paymentType === "insurance"
            ? !isLoading && insurancePaymentDetails?.status === "PENDING"
            : false;

  useEffect(() => {
    if (isFailed) {
      router.replace(`/payment/failure?order_id=${orderId}`);
    }
  }, [isFailed, orderId, router]);

  const handleViewDetails = () => {
    if (paymentType === "tour") {
      router.push(`/tours/order/details?order_id=${orderId}`);
    } else if (paymentType === "transfer") {
      router.push(`/transfer/order/details?order_id=${orderId}`);
    } else {
      router.push("/");
    }
  };

  const handleGoHome = () => {
    router.push("/");
  };

  if (isFailed) {
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
        completed={isCompleted}
        paymentType={paymentType}
      />

      {isCompleted && !isLoading && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-xl p-4 border-2 border-green-200 animate-fade-in z-50">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-2">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">
                Payment Successful!
              </p>
            </div>

            <div className="flex gap-2">
              {(paymentType === "tour" || paymentType === "transfer") && (
                <button
                  onClick={handleViewDetails}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
              )}
              <button
                onClick={handleGoHome}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Go Home
              </button>
            </div>
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
