"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  const getPaymentType = (): PaymentType => {
    if (!orderId) return "unknown";
    if (orderId.startsWith("TOUR_ORDER_")) return "tour";
    if (orderId.startsWith("QP_")) return "quick";
    if (orderId.startsWith("TRANSFER_ORDER_")) return "transfer";
    if (orderId.startsWith("INS_")) return "insurance";
    return "unknown";
  };

  const paymentType = getPaymentType();

  // Use appropriate hook based on payment type
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

  // Get the relevant data based on payment type
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

  useEffect(() => {
    if (isCompleted && !isLoading) {
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);

            if (paymentType === "tour") {
              router.push(`/tours/order/details?order_id=${orderId}`);
            } else if (paymentType === "transfer") {
              router.push(`/transfer/order/details?order_id=${orderId}`);
            } else {
              router.push("/");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isCompleted, isLoading, paymentType, orderId, router]);

  if (isFailed) {
    return null;
  }

  const handleRedirectNow = () => {
    if (paymentType === "tour") {
      router.push(`/tours/order/details?order_id=${orderId}`);
    } else if (paymentType === "transfer") {
      router.push(`/transfer/order/details?order_id=${orderId}`);
    } else {
      router.push("/");
    }
  };

  const getRedirectMessage = () => {
    if (paymentType === "tour") return "order details";
    if (paymentType === "transfer") return "booking details";
    return "home";
  };

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
                Redirecting to {getRedirectMessage()}
              </p>
              <p className="text-xs text-gray-500">
                in {redirectCountdown} second
                {redirectCountdown !== 1 ? "s" : ""}...
              </p>
            </div>
            <button
              onClick={handleRedirectNow}
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
