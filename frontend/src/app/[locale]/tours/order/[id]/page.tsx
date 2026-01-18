"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarDays,
  ChevronRight,
  MapPin,
  PersonStanding,
  Timer,
  Wallet,
  User,
  Phone,
  Mail,
  RefreshCw,
  AlertCircle,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Printer,
} from "lucide-react";

interface OrderData {
  id: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  peopleAmount: number;
  selectedDate: string;
  tourDurationDays: number;
  tourDurationNights: number;
  tourName: string;
  tourDescription: string;
  startLocation: string;
  endLocation: string;
  locations: string[];
  isFullPayment: boolean;
  totalTourPrice: number;
  amountPaid: number;
  amountRemaining?: number;
  externalOrderId: string;
  bogOrderId: string;
  status: string;
  paymentUrl?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

interface Translations {
  orderDetails: string;
  customerInformation: string;
  name: string;
  email: string;
  phone: string;
  tourDetails: string;
  startDate: string;
  personCount: string;
  duration: string;
  day: string;
  night: string;
  paymentType: string;
  fullPayment: string;
  partialPayment: string;
  paymentInformation: string;
  totalAmount: string;
  amountPaid: string;
  amountRemaining: string;
  paymentExpires: string;
  completePayment: string;
  routeInformation: string;
  startLocation: string;
  endLocation: string;
  tourDestinations: string;
  refresh: string;
  orderNotFound: string;
  errorLoadingOrder: string;
  loadingOrderDetails: string;
  tryAgain: string;
  statusPending: string;
  statusConfirmed: string;
  statusCompleted: string;
  statusCancelled: string;
}

interface PageParams {
  id: string;
  locale: string;
}

interface PageProps {
  params: Promise<PageParams>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Translation dictionaries
const translations: Record<string, Translations> = {
  en: {
    orderDetails: "Order Details",
    customerInformation: "Customer Information",
    name: "Name",
    email: "Email",
    phone: "Phone",
    tourDetails: "Tour Details",
    startDate: "Start Date",
    personCount: "Person Count",
    duration: "Duration",
    day: "Day",
    night: "Night",
    paymentType: "Payment Type",
    fullPayment: "Full Payment",
    partialPayment: "Partial Payment",
    paymentInformation: "Payment Information",
    totalAmount: "Total Amount",
    amountPaid: "Amount Paid",
    amountRemaining: "Amount Remaining",
    paymentExpires: "Payment Expires",
    completePayment: "Complete Payment",
    routeInformation: "Route Information",
    startLocation: "Start Location",
    endLocation: "End Location",
    tourDestinations: "Tour Destinations",
    refresh: "Refresh",
    orderNotFound: "Order Not Found",
    errorLoadingOrder: "Error Loading Order",
    loadingOrderDetails: "Loading Order Details",
    tryAgain: "Try Again",
    statusPending: "Pending",
    statusConfirmed: "Confirmed",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
  },
  ka: {
    orderDetails: "შეკვეთის დეტალები",
    customerInformation: "კლიენტის ინფორმაცია",
    name: "სახელი",
    email: "ელ-ფოსტა",
    phone: "ტელეფონი",
    tourDetails: "ტურის დეტალები",
    startDate: "დაწყების თარიღი",
    personCount: "ადამიანების რაოდენობა",
    duration: "ხანგრძლივობა",
    day: "დღე",
    night: "ღამე",
    paymentType: "გადახდის ტიპი",
    fullPayment: "სრული გადახდა",
    partialPayment: "ნაწილობრივი გადახდა",
    paymentInformation: "გადახდის ინფორმაცია",
    totalAmount: "მთლიანი თანხა",
    amountPaid: "გადახდილი თანხა",
    amountRemaining: "დარჩენილი თანხა",
    paymentExpires: "გადახდა იწურება",
    completePayment: "გადახდის დასრულება",
    routeInformation: "მარშრუტის ინფორმაცია",
    startLocation: "საწყისი ლოკაცია",
    endLocation: "საბოლოო ლოკაცია",
    tourDestinations: "ტურის მიმართულებები",
    refresh: "განახლება",
    orderNotFound: "შეკვეთა ვერ მოიძებნა",
    errorLoadingOrder: "შეკვეთის ჩატვირთვის შეცდომა",
    loadingOrderDetails: "შეკვეთის დეტალების ჩატვირთვა",
    tryAgain: "თავიდან ცდა",
    statusPending: "მიმდინარე",
    statusConfirmed: "დადასტურებული",
    statusCompleted: "დასრულებული",
    statusCancelled: "გაუქმებული",
  },
};

interface UnifiedOrderDetailsProps {
  orderId: string;
  locale: string;
  isRTL: boolean;
  translations: Translations;
}

const UnifiedOrderDetailsClient: React.FC<UnifiedOrderDetailsProps> = ({
  orderId,
  locale,
  isRTL,
  translations: t,
}) => {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setError(t.orderNotFound);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/tours/orders/${orderId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(t.orderNotFound);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setOrder(result.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorLoadingOrder);
    } finally {
      setLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const formatDate = useCallback(
    (dateString: string) => {
      try {
        return new Date(dateString).toLocaleDateString(locale);
      } catch {
        return "Invalid Date";
      }
    },
    [locale]
  );

  const formatDateTime = useCallback(
    (dateString: string) => {
      try {
        return new Date(dateString).toLocaleString(locale);
      } catch {
        return "Invalid Date";
      }
    },
    [locale]
  );

  const statusConfig = useMemo(() => {
    const status = order?.status?.toLowerCase();

    if (status === "pending") {
      return {
        color: "text-yellow-700 bg-yellow-50 border-yellow-200",
        icon: AlertTriangle,
        text: t.statusPending,
      };
    }

    if (status === "paid" || status === "confirmed") {
      return {
        color: "text-green-700 bg-green-50 border-green-200",
        icon: CheckCircle,
        text: t.statusConfirmed,
      };
    }

    if (status === "completed") {
      return {
        color: "text-green-700 bg-green-50 border-green-200",
        icon: CheckCircle,
        text: t.statusCompleted,
      };
    }

    if (status === "cancelled" || status === "failed") {
      return {
        color: "text-red-700 bg-red-50 border-red-200",
        icon: XCircle,
        text: t.statusCancelled,
      };
    }

    return {
      color: "text-gray-700 bg-gray-50 border-gray-200",
      icon: AlertCircle,
      text: order?.status?.toUpperCase() || "UNKNOWN",
    };
  }, [order?.status, t]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-600">{t.loadingOrderDetails}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          {t.errorLoadingOrder}
        </h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchOrder}
          className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {t.tryAgain}
        </button>
      </div>
    );
  }

  if (!order) return null;

  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={`container mx-auto p-4 md:p-6 max-w-4xl ${isRTL ? "rtl" : "ltr"}`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          {t.orderDetails}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Printer className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            PDF
          </button>
          <button
            onClick={fetchOrder}
            className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {t.refresh}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-4 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between gap-4 pb-4 border-b">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                {order.tourName}
              </h2>
              <p className="text-sm text-gray-600">ID: {order.id.slice(-8)}</p>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${statusConfig.color}`}
            >
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{statusConfig.text}</span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-bold">{t.customerInformation}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold">{t.name}:</span>
                <span className="text-sm">
                  {order.customerFirstName} {order.customerLastName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold">{t.email}:</span>
                <span className="text-sm">{order.customerEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold">{t.phone}:</span>
                <span className="text-sm">{order.customerPhone}</span>
              </div>
            </div>
          </div>

          {/* Tour Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-bold">{t.tourDetails}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold">{t.startDate}:</span>
                <span className="text-sm">
                  {formatDate(order.selectedDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PersonStanding className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold">{t.personCount}:</span>
                <span className="text-sm">{order.peopleAmount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold">{t.duration}:</span>
                <span className="text-sm">
                  {order.tourDurationDays} {t.day}
                  {order.tourDurationNights > 0 && (
                    <>
                      {" "}
                      / {order.tourDurationNights} {t.night}
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold">{t.paymentType}:</span>
                <span className="text-sm">
                  {order.isFullPayment ? t.fullPayment : t.partialPayment}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-bold">{t.paymentInformation}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold">{t.totalAmount}:</span>
                <span className="text-sm font-semibold text-green-600">
                  ₾{order.totalTourPrice}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold">{t.amountPaid}:</span>
                <span className="text-sm font-semibold text-green-600">
                  ₾{order.amountPaid}
                </span>
              </div>
              {order.amountRemaining && order.amountRemaining > 0 && (
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-semibold">
                    {t.amountRemaining}:
                  </span>
                  <span className="text-sm font-semibold text-orange-600">
                    ₾{order.amountRemaining}
                  </span>
                </div>
              )}
            </div>

            {order.status === "PENDING" && order.paymentUrl && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 print:hidden">
                <p className="text-sm text-orange-700 mb-3">
                  {t.paymentExpires}: {formatDateTime(order.expiresAt)}
                </p>
                <a
                  href={order.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                  {t.completePayment}
                </a>
              </div>
            )}
          </div>

          {/* Route Information */}
          {order.locations && order.locations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-bold">{t.routeInformation}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <h4 className="font-medium mb-2 text-sm">
                  {t.tourDestinations}:
                </h4>
                <div className="flex flex-wrap items-center gap-y-2">
                  {[order.startLocation, ...order.locations].map(
                    (location, index, array) => (
                      <div key={index} className="flex items-center">
                        <span className="text-sm bg-white px-2 py-1 rounded border">
                          {location}
                        </span>
                        {index < array.length - 1 && (
                          <ChevronRight
                            className={`mx-2 w-4 h-4 text-gray-400 ${isRTL ? "rotate-180" : ""}`}
                          />
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {order.tourDescription && (
            <div className="border-t pt-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                {order.tourDescription}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Server Component Wrapper
export default async function OrderDetailsPage({ params }: PageProps) {
  const { id, locale } = await params;

  // Determine if RTL based on locale
  const isRTL = locale === "ar" || locale === "he" || locale === "fa";

  // Get translations for the locale
  const t = translations[locale] || translations.en;

  return (
    <UnifiedOrderDetailsClient
      orderId={id}
      locale={locale}
      isRTL={isRTL}
      translations={t}
    />
  );
}
