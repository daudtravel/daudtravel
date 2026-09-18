import React from "react";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
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
}) => <h2 className={`text-2xl font-semibold ${className}`}>{children}</h2>;

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
  const t = useTranslations("payment.result");

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
        expiration: t("rejectExpiration"),
        timeout: t("rejectTimeout"),
        cancelled: t("rejectCancelled"),
        insufficient_funds: t("rejectInsufficientFunds"),
        card_declined: t("issueDeclined"),
        invalid_card: t("rejectInvalidCard"),
        unknown: t("rejectUnknown"),
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
    return t("couldNotProcess");
  };

  const getSuccessMessage = () => {
    if (paymentType === "tour") return t("successTour");
    if (paymentType === "transfer") return t("successTransfer");
    if (paymentType === "insurance") return t("successInsurance");
    if (paymentType === "quick") return t("successQuick");
    return t("successGeneric");
  };

  const getEmailMessage = () => {
    if (paymentType === "tour") return t("emailTour");
    if (paymentType === "transfer") return t("emailTransfer");
    if (paymentType === "insurance") return t("emailInsurance");
    return t("emailGeneric");
  };

  if (isLoading || isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-center text-gray-600">
              {isPending ? t("verifying") : t("checkingStatus")}
            </p>
            <p className="text-center text-gray-400 text-sm mt-2">
              {t("pleaseWait")}
            </p>
            {isPending && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3 w-full">
                <p className="text-blue-800 text-sm text-center">
                  💳 {t("bankProcessing")}
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
              {t("verificationError")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => (window.location.href = "/")}>
                {t("returnHome")}
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/contact")}
              >
                {t("contactSupport")}
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
              {t("successTitle")}
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
                      {t("amountPaid")}
                    </span>
                    <span className="text-lg font-bold text-blue-900">
                      {paymentDetails.amount.currency}{" "}
                      {paymentDetails.amount.transferred.toFixed(2)}
                    </span>
                  </div>
                  {paymentDetails.transaction_id && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <span className="text-xs text-blue-700">
                        {t("transactionId", {
                          id: paymentDetails.transaction_id,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}

            {/* Quick Payment Details */}
            {paymentType === "quick" && quickPaymentDetails && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="mb-3">
                  <span className="text-sm text-gray-600">{t("product")}</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {quickPaymentDetails.productName}
                  </p>
                  {quickPaymentDetails.productDescription && (
                    <p className="text-sm text-gray-600 mt-1">
                      {quickPaymentDetails.productDescription}
                    </p>
                  )}
                </div>
                {quickPaymentDetails.productQuantity &&
                  quickPaymentDetails.productQuantity > 1 && (
                    <div className="flex justify-between items-center pb-2">
                      <span className="text-sm text-gray-600">{t("quantity")}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {quickPaymentDetails.productQuantity}
                      </span>
                    </div>
                  )}
                <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                  <span className="text-sm text-blue-900 font-medium">
                    {t("amountPaid")}
                  </span>
                  <span className="text-lg font-bold text-blue-900">
                    ₾
                    {(
                      quickPaymentDetails.productTotalPrice ||
                      quickPaymentDetails.productUnitPrice ||
                      0
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Insurance Payment Details */}
            {paymentType === "insurance" && insurancePaymentDetails && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="mb-3">
                  <span className="text-sm text-gray-600">{t("insuranceFor")}</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {t("peopleCount", {
                      count: insurancePaymentDetails.peopleCount,
                    })}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                  <span className="text-sm text-blue-900 font-medium">
                    {t("totalAmount")}
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
                📧 {t("checkInbox")}
              </p>
            </div>

            <div className="pt-4 space-y-2">
              <Button onClick={() => (window.location.href = "/")}>
                {t("returnHome")}
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
            {t("failedTitle")}
          </CardTitle>
          <CardDescription>{getErrorMessage()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentDetails?.external_order_id && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <p className="text-xs text-gray-600">
                {t("orderReference", {
                  ref: paymentDetails.external_order_id.slice(-12),
                })}
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-blue-900 text-sm font-medium mb-2">
              {t("commonIssues")}
            </p>
            <ul className="text-blue-800 text-xs space-y-1 list-disc list-inside">
              <li>{t("issueDeclined")}</li>
              <li>{t("issueFunds")}</li>
              <li>{t("issueDetails")}</li>
              <li>{t("issueExpired")}</li>
            </ul>
          </div>

          <div className="pt-4 space-y-2">
            <Button onClick={() => (window.location.href = "/")}>
              {t("tryAgain")}
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/contact")}
            >
              {t("contactSupport")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentStatusCard;
