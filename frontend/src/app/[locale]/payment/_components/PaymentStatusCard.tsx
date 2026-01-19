import React from "react";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import {
  PaymentStatusResponse,
  QuickPaymentDetails,
  InsurancePaymentDetails,
} from "../types";

type PaymentType = "tour" | "quick" | "transfer" | "insurance" | "unknown";

interface PaymentStatusCardProps {
  isLoading: boolean;
  paymentDetails?: PaymentStatusResponse | null;
  quickPaymentDetails?: QuickPaymentDetails | null;
  insurancePaymentDetails?: InsurancePaymentDetails | null;
  error: string;
  completed: boolean;
  paymentType: PaymentType;
}

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-white rounded-lg shadow-lg ${className}`}>{children}</div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-4 border-b border-gray-200">{children}</div>
);

const CardTitle = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <h2 className={`text-2xl font-bold ${className}`}>{children}</h2>;

const CardDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-gray-600 mt-2">{children}</p>
);

const CardContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`px-6 py-4 ${className}`}>{children}</div>;

const Button = ({
  children,
  variant = "default",
  className = "",
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  const baseStyles =
    "w-full py-2 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variantStyles =
    variant === "outline"
      ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      : "bg-blue-600 text-white hover:bg-blue-700";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {children}
    </button>
  );
};

const PaymentStatusCard: React.FC<PaymentStatusCardProps> = ({
  isLoading,
  paymentDetails,
  quickPaymentDetails,
  insurancePaymentDetails,
  error,
  completed,
  paymentType,
}) => {
  const isSuccess =
    paymentType === "quick"
      ? quickPaymentDetails?.status === "PAID"
      : paymentType === "insurance"
        ? insurancePaymentDetails?.status === "PAID"
        : completed &&
          paymentDetails?.success === true &&
          (paymentDetails?.status === "completed" ||
            paymentDetails?.status === "PAID") &&
          (paymentDetails?.payment_response?.code === "100" ||
            paymentDetails?.payment_response?.is_successful === true);

  const isPending =
    paymentType === "quick"
      ? !isLoading && quickPaymentDetails?.status === "PENDING"
      : paymentType === "insurance"
        ? !isLoading && insurancePaymentDetails?.status === "PENDING"
        : !isLoading &&
          paymentDetails &&
          (paymentDetails.success === null ||
            paymentDetails.status === "PENDING" ||
            paymentDetails.status === "pending");

  const getErrorMessage = (): string => {
    if (paymentDetails?.payment_response?.description) {
      return paymentDetails.payment_response.description;
    }
    if (paymentDetails?.status_description) {
      return paymentDetails.status_description;
    }
    if (paymentDetails?.reject_reason) {
      const reasons: Record<string, string> = {
        expiration:
          "Payment session expired - the order took too long to complete",
        timeout: "Payment timed out - please try again",
        cancelled: "Payment was cancelled by user",
        insufficient_funds: "Insufficient funds in account",
        card_declined: "Card was declined by your bank",
        invalid_card: "Invalid card details provided",
        unknown: "Payment failed due to an unknown error",
      };
      return (
        reasons[paymentDetails.reject_reason.toLowerCase()] ||
        paymentDetails.reject_reason
      );
    }
    if (paymentDetails?.message) {
      return paymentDetails.message;
    }
    if (error) {
      return error;
    }
    return "Your payment could not be processed";
  };

  const getSuccessMessage = () => {
    if (paymentType === "tour")
      return "Congratulations! You have successfully purchased your tour.";
    if (paymentType === "transfer")
      return "Your transfer has been booked successfully!";
    if (paymentType === "insurance")
      return "Your insurance application has been submitted successfully.";
    if (paymentType === "quick")
      return "Your payment has been completed successfully.";
    return "Payment completed successfully!";
  };

  const getEmailMessage = () => {
    if (paymentType === "tour")
      return "You will receive tour information via email shortly.";
    if (paymentType === "transfer")
      return "You will receive transfer confirmation via email shortly.";
    if (paymentType === "insurance")
      return "We will process your insurance application and contact you soon.";
    return "Payment confirmation has been sent to your email.";
  };

  if (isLoading || isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-center text-gray-600">
              {isPending
                ? "Verifying your payment..."
                : "Checking payment status..."}
            </p>
            <p className="text-center text-gray-400 text-sm mt-2">
              Please wait, this may take a few seconds
            </p>
            {isPending && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3 w-full">
                <p className="text-blue-800 text-sm text-center">
                  💳 Your payment is being processed by the bank
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (
    error &&
    !paymentDetails &&
    !quickPaymentDetails &&
    !insurancePaymentDetails
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Verification Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => (window.location.href = "/")}>
                Return Home
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/contact")}
              >
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ SUCCESS STATE
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Payment Successful!
            </CardTitle>
            <CardDescription>{getSuccessMessage()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tour/Transfer Payment Details */}
            {(paymentType === "tour" || paymentType === "transfer") &&
              paymentDetails?.amount && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-900 font-medium">
                      Amount Paid:
                    </span>
                    <span className="text-lg font-bold text-blue-900">
                      {paymentDetails.amount.currency}{" "}
                      {paymentDetails.amount.transferred.toFixed(2)}
                    </span>
                  </div>
                  {paymentDetails.transaction_id && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <span className="text-xs text-blue-700">
                        Transaction ID: {paymentDetails.transaction_id}
                      </span>
                    </div>
                  )}
                </div>
              )}

            {/* Quick Payment Details */}
            {paymentType === "quick" && quickPaymentDetails && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="mb-3">
                  <span className="text-sm text-gray-600">Product:</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {quickPaymentDetails.productName}
                  </p>
                  {quickPaymentDetails.productDescription && (
                    <p className="text-sm text-gray-600 mt-1">
                      {quickPaymentDetails.productDescription}
                    </p>
                  )}
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                  <span className="text-sm text-blue-900 font-medium">
                    Amount Paid:
                  </span>
                  <span className="text-lg font-bold text-blue-900">
                    ₾{quickPaymentDetails.productPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Insurance Payment Details */}
            {paymentType === "insurance" && insurancePaymentDetails && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="mb-3">
                  <span className="text-sm text-gray-600">Insurance for:</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {insurancePaymentDetails.peopleCount}{" "}
                    {insurancePaymentDetails.peopleCount === 1
                      ? "person"
                      : "people"}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                  <span className="text-sm text-blue-900 font-medium">
                    Total Amount:
                  </span>
                  <span className="text-lg font-bold text-blue-900">
                    ₾{insurancePaymentDetails.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800 text-sm mb-2">
                ✅ {getEmailMessage()}
              </p>
              <p className="text-green-800 text-sm">
                📧 Check your inbox for confirmation.
              </p>
            </div>

            <div className="pt-4 space-y-2">
              <Button onClick={() => (window.location.href = "/")}>
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-6 w-6" />
            Payment Failed
          </CardTitle>
          <CardDescription>{getErrorMessage()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentDetails?.external_order_id && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <p className="text-xs text-gray-600">
                Order Reference: {paymentDetails.external_order_id.slice(-12)}
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-blue-900 text-sm font-medium mb-2">
              Common issues:
            </p>
            <ul className="text-blue-800 text-xs space-y-1 list-disc list-inside">
              <li>Card was declined by your bank</li>
              <li>Insufficient funds</li>
              <li>Incorrect card details</li>
              <li>Payment session expired</li>
            </ul>
          </div>

          <div className="pt-4 space-y-2">
            <Button onClick={() => (window.location.href = "/")}>
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/contact")}
            >
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentStatusCard;
