"use client";

import type React from "react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  CalendarDays,
  MapPin,
  PersonStanding,
  Timer,
  Wallet,
  User,
  Phone,
  Mail,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Printer,
  Car,
  ArrowRight,
} from "lucide-react";
import { useParams } from "next/navigation";
import { cn } from "@/src/utlis/cn";

interface TransferData {
  id: string;
  externalOrderId: string;
  bogOrderId: string;
  status: string;
  paymentAmount: number;
  currency: string;
  paymentUrl?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string;
  };
  transfer: {
    name: string;
    date: string;
    time: string;
    vehicleType: string;
    passengerCount: number;
    startLocation: string;
    endLocation: string;
    route: string;
  };
}

const TransferDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);

  const [transfer, setTransfer] = useState<TransferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const fetchTransfer = async () => {
    if (!id) {
      setError("Transfer not found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/transfer/order/${id}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Transfer not found");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setTransfer(result.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading transfer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfer();
  }, [id]);

  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-CA");
    } catch {
      return "Invalid Date";
    }
  }, []);

  const formatTime = useCallback((timeString: string) => {
    try {
      return new Date(timeString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Time";
    }
  }, []);

  const formatDateTime = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("en-CA");
    } catch {
      return "Invalid Date";
    }
  }, []);

  const statusConfig = useMemo(() => {
    switch (transfer?.status) {
      case "pending":
        return {
          color: "text-yellow-700 bg-yellow-50 border-yellow-200",
          icon: AlertTriangle,
          text: "PENDING",
        };
      case "confirmed":
        return {
          color: "text-blue-700 bg-blue-50 border-blue-200",
          icon: Clock,
          text: "CONFIRMED",
        };
      case "completed":
        return {
          color: "text-green-700 bg-green-50 border-green-200",
          icon: CheckCircle,
          text: "COMPLETED",
        };
      case "cancelled":
        return {
          color: "text-red-700 bg-red-50 border-red-200",
          icon: XCircle,
          text: "CANCELLED",
        };
      default:
        return {
          color: "text-gray-700 bg-gray-50 border-gray-200",
          icon: AlertCircle,
          text: transfer?.status?.toUpperCase() || "UNKNOWN",
        };
    }
  }, [transfer?.status]);

  const vehicleTypeDisplay = useMemo(() => {
    const vehicleTypes: Record<string, string> = {
      sedan: "Sedan",
      MINIVAN: "Minivan",
      VITO: "Vito",
      SPRINTER: "Sprinter",
      BUS: "Bus",
    };
    return (
      vehicleTypes[transfer?.transfer.vehicleType || ""] ||
      transfer?.transfer.vehicleType ||
      "Unknown"
    );
  }, [transfer?.transfer.vehicleType]);

  const handleRefresh = useCallback(() => {
    fetchTransfer();
  }, []);

  const handlePrint = useCallback(async () => {
    if (!transfer || !printRef.current) return;

    try {
      setIsGeneratingPDF(true);

      const canvas = await html2canvas(printRef.current, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        width: printRef.current.scrollWidth,
        height: printRef.current.scrollHeight,
        removeContainer: true,
        logging: false,
        imageTimeout: 5000,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[ref="printRef"]');
          if (clonedElement) {
            const buttons = clonedElement.querySelectorAll("button");
            buttons.forEach((button) => button.remove());
          }
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.8);
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`transfer-${transfer.id.slice(-8)}.pdf`);
    } catch (error) {
      alert("Error generating PDF. Please try again.");
      console.log(error);
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [transfer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading transfer details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Error Loading Transfer
        </h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  if (!transfer) return null;

  const StatusIcon = statusConfig.icon;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Transfer Details
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            disabled={isGeneratingPDF}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Printer className="w-4 h-4 mr-2" />
            {isGeneratingPDF ? "Generating..." : "Download PDF"}
          </button>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <Card className="w-full" ref={printRef}>
        <CardContent className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 pb-4 border-b">
            <div className="flex-1">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                {transfer.transfer.name}
              </h2>
              <p className="text-sm text-gray-600">
                Order ID: {transfer.id.slice(-8)}
              </p>
            </div>
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border",
                statusConfig.color
              )}
            >
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{statusConfig.text}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold">Customer Information</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold">Name:</span>
                <span className="text-sm">{transfer.customer.fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold">Email:</span>
                <span className="text-sm">{transfer.customer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold">Phone:</span>
                <span className="text-sm">{transfer.customer.phone}</span>
              </div>
            </div>
          </div>

          {/* Transfer Details */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold">Transfer Details</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold">Date:</span>
                <span className="text-sm">
                  {formatDate(transfer.transfer.date)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold">Time:</span>
                <span className="text-sm">
                  {formatTime(transfer.transfer.time)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold">Vehicle:</span>
                <span className="text-sm">{vehicleTypeDisplay}</span>
              </div>
              <div className="flex items-center gap-2">
                <PersonStanding className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold">Passengers:</span>
                <span className="text-sm">
                  {transfer.transfer.passengerCount}
                </span>
              </div>
            </div>
          </div>

          {/* Route Information */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold">Route Information</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm font-semibold">From</p>
                  <p className="text-sm text-gray-600">
                    {transfer.transfer.startLocation}
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400" />
                <div className="text-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm font-semibold">To</p>
                  <p className="text-sm text-gray-600">
                    {transfer.transfer.endLocation}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold">Payment Information</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold">Amount:</span>
                <span className="text-sm font-semibold text-green-600">
                  {transfer.paymentAmount} {transfer.currency}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold">Created:</span>
                <span className="text-sm">
                  {formatDateTime(transfer.createdAt)}
                </span>
              </div>
            </div>

            {/* Payment Action for Pending Status */}
            {transfer.status === "pending" && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-700">
                    Payment expires:
                  </span>
                  <span className="text-sm text-orange-600">
                    {formatDateTime(transfer.expiresAt)}
                  </span>
                </div>
                {transfer.paymentUrl && (
                  <a
                    href={transfer.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Complete Payment
                  </a>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransferDetails;
