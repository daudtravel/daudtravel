"use client";

import type React from "react";
import { useState, useCallback, useMemo } from "react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  CreditCard,
  Loader2,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  Clock,
  Car,
  ArrowRight,
  AlertCircle,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { BookingData } from "./BookingPanel";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: BookingData | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, bookingData }) => {
  const t = useTranslations("transfers");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequests: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [message, setMessage] = useState("");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((p) => ({ ...p, [name]: value }));
      setMessage("");
      setPaymentStatus("idle");
    },
    []
  );

  const validate = useCallback((): boolean => {
    const { firstName, lastName, email, phone } = formData;
    if (!firstName.trim()) { setMessage(t("firstNameRequired")); return false; }
    if (!lastName.trim()) { setMessage(t("lastNameRequired")); return false; }
    if (!email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) { setMessage(t("emailRequired")); return false; }
    if (!phone.trim()) { setMessage(t("phoneRequired")); return false; }
    setMessage("");
    return true;
  }, [formData, t]);

  const submit = useCallback(async () => {
    if (!bookingData || !validate()) {
      setPaymentStatus("failed");
      return;
    }

    setIsLoading(true);
    setPaymentStatus("processing");
    setMessage(t("creatingPaymentSession"));

    try {
      const payload = {
        bookingData: {
          transferId: bookingData.transferId,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          passengerCount: bookingData.passengerCount,
          transferDate: bookingData.transferDate.toISOString(),
          transferTime: bookingData.transferTime.toISOString(),
          vehicleType: bookingData.vehicleType,
          paymentAmount: bookingData.paymentAmount,
          startLocation: bookingData.startLocation,
          endLocation: bookingData.endLocation,
          ...(bookingData.driverId ? { driverId: bookingData.driverId } : {}),
          specialRequests: formData.specialRequests.trim() || undefined,
        },
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/transfers/payments/bog/create`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );

      if (!res.ok) {
        let err: { message?: string } = {};
        try { err = await res.json(); } catch { /* empty */ }
        throw new Error(err.message || t("paymentCreationFailed"));
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.message || t("paymentSessionFailed"));

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setPaymentStatus("success");
        setMessage(t("paymentSessionCreated"));
      }
    } catch (err) {
      setPaymentStatus("failed");
      setMessage(err instanceof Error ? err.message : t("paymentCreationFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [bookingData, formData, validate, t]);

  const close = useCallback(() => {
    if (isLoading) return;
    setFormData({ firstName: "", lastName: "", email: "", phone: "", specialRequests: "" });
    setPaymentStatus("idle");
    setMessage("");
    onClose();
  }, [isLoading, onClose]);

  const statusStyle = useMemo(() => {
    if (paymentStatus === "success") return { cls: "bg-green-50 border-green-200 text-green-800", icon: <CheckCircle className="h-4 w-4 text-green-600 shrink-0" /> };
    if (paymentStatus === "failed") return { cls: "bg-red-50 border-red-200 text-red-800", icon: <XCircle className="h-4 w-4 text-red-600 shrink-0" /> };
    if (paymentStatus === "processing") return { cls: "bg-blue-50 border-blue-200 text-blue-800", icon: <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" /> };
    return null;
  }, [paymentStatus]);

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-brand-green pr-6">
            {t("completeBooking")}
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm">
            {t("fillDetailsDescription")}
          </DialogDescription>
        </DialogHeader>

        {/* Booking summary */}
        {bookingData && (
          <div className="rounded-xl bg-brand-green-50 border border-brand-green-100 p-4 mb-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-green mb-3">
              {t("transferDetails")}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-brand-green shrink-0" />
                <span className="text-sm text-gray-700 font-medium">{bookingData.startLocation}</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700 font-medium">{bookingData.endLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-brand-green shrink-0" />
                <span className="text-sm text-gray-600">{bookingData.transferDate.toLocaleDateString()}</span>
                <Clock className="h-3.5 w-3.5 text-brand-green shrink-0 ml-2" />
                <span className="text-sm text-gray-600">
                  {bookingData.transferTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-3.5 w-3.5 text-brand-green shrink-0" />
                <span className="text-sm text-gray-600 capitalize">{bookingData.vehicleType}</span>
                <span className="text-xs text-gray-400">({bookingData.passengerCount} {t("passengers")})</span>
              </div>
              {bookingData.driverName && (
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-brand-green shrink-0" />
                  <span className="text-sm text-gray-600 font-medium">{bookingData.driverName}</span>
                </div>
              )}
              <div className="h-px bg-brand-green-100 my-1" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-brand-green">{t("total")}</span>
                <span className="text-xl font-bold text-brand-green">₾{bookingData.paymentAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(["firstName", "lastName"] as const).map((field) => (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={field} className="text-sm font-medium text-gray-700">
                  {t(field)} <span className="text-red-400">*</span>
                </Label>
                <Input
                  id={field}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder={t(`${field}Placeholder`)}
                  className="border-gray-200 focus-visible:ring-brand-green"
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              {t("email")} <span className="text-red-400">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              placeholder={t("emailPlaceholder")}
              className="border-gray-200 focus-visible:ring-brand-green"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
              {t("phone")} <span className="text-red-400">*</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              disabled={isLoading}
              placeholder={t("phonePlaceholder")}
              className="border-gray-200 focus-visible:ring-brand-green"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="specialRequests" className="text-sm font-medium text-gray-700">
              {t("specialRequests")}{" "}
              <span className="text-gray-400 text-xs font-normal">({t("optional")})</span>
            </Label>
            <textarea
              id="specialRequests"
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleChange}
              disabled={isLoading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green resize-none text-sm"
              placeholder={t("specialRequestsPlaceholder")}
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">{t("commissionNote")}</p>
          </div>

          {message && statusStyle && (
            <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-sm ${statusStyle.cls}`}>
              {statusStyle.icon}
              <span>{message}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3 mt-4">
          <button
            onClick={close}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            {t("cancel")}
          </button>
          <button
            onClick={submit}
            disabled={isLoading || !bookingData}
            className="flex-1 py-2.5 rounded-xl bg-brand-yellow hover:bg-brand-yellow-dark text-brand-green font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{t("processing")}</>
            ) : (
              <><CreditCard className="h-4 w-4" />{t("pay")} {bookingData ? `₾${bookingData.paymentAmount.toFixed(2)}` : "₾0.00"}</>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
