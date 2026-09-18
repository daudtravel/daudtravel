"use client";

import React from "react";
import {
  ArrowLeft,
  Mail,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Download,
  ExternalLink,
  User,
  Phone,
  ImageIcon,
  Calendar,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useInsuranceSubmission } from "@/src/hooks/insurance/useInsurance";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { PaymentStatus } from "@/src/types/insurance.types";

// Define the Person type based on your API response
interface InsurancePerson {
  id: string;
  fullName: string;
  phoneNumber: string;
  passportPhoto: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  pricePerDay: number;
  baseAmount: number;
  discount: number;
  finalAmount: number;
  createdAt: string;
}

export const InsuranceSubmissionDetails: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("insurance");
  const t = useTranslations("admin");
  const locale = useLocale();

  const { data: submissionData, isLoading } = useInsuranceSubmission(
    submissionId || ""
  );

  const submission = submissionData?.data;

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return (
          <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
            {t("status.paid")}
          </span>
        );
      case PaymentStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
            {t("status.inProgress")}
          </span>
        );
      case PaymentStatus.FAILED:
        return (
          <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-red-100 text-red-800">
            <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
            {t("status.failed")}
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-12 text-red-600">{t("insurance.notFound")}</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <button
              onClick={() => router.push(`${pathname}?insurance=all`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                {t("insurance.orderDetails")}
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm mt-1 truncate">
                {t("common.orderId", { id: submission.externalOrderId })}
              </p>
            </div>
            <div className="flex-shrink-0">
              {getStatusBadge(submission.status)}
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="p-4 sm:p-6 border-b bg-gray-50">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
            {t("insurance.paymentInfo")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs sm:text-sm text-gray-600">
                {t("insurance.senderEmail")}
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                  {submission.submitterEmail}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs sm:text-sm text-gray-600">
                {t("common.peopleCount")}
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="font-medium text-gray-900 text-sm sm:text-base">
                  {t("insurance.peopleValue", { count: submission.peopleCount })}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs sm:text-sm text-gray-600">
                {t("insurance.totalDays")}
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="font-medium text-gray-900 text-sm sm:text-base">
                  {t("common.days", { count: submission.totalDays })}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs sm:text-sm text-gray-600">
                {t("insurance.totalAmount")}
              </label>
              <p className="font-semibold text-xl sm:text-2xl text-green-600 mt-1">
                ₾{Number(submission.totalAmount).toFixed(2)}
              </p>
            </div>
            {submission.transactionId && (
              <div className="sm:col-span-2">
                <label className="text-xs sm:text-sm text-gray-600">
                  {t("insurance.transactionId")}
                </label>
                <p className="font-mono text-xs sm:text-sm text-gray-900 mt-1 break-all">
                  {submission.transactionId}
                </p>
              </div>
            )}
            {submission.paymentMethod && (
              <div>
                <label className="text-xs sm:text-sm text-gray-600">
                  {t("insurance.paymentMethod")}
                </label>
                <p className="font-medium text-gray-900 mt-1 text-sm sm:text-base">
                  {submission.paymentMethod}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Email Status */}
        <div className="p-4 sm:p-6 border-b">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
            {t("insurance.emailStatus")}
          </h3>
          {submission.emailSent ? (
            <div className="flex items-start gap-3 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium text-green-900 text-sm sm:text-base">
                  {t("insurance.emailSent")}
                </p>
                {submission.emailSentAt && (
                  <p className="text-xs sm:text-sm text-green-700 break-all">
                    {new Date(submission.emailSentAt).toLocaleString(locale, {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <XCircle className="w-5 h-5 text-gray-600 flex-shrink-0" />
              <p className="font-medium text-gray-900 text-sm sm:text-base">
                {t("insurance.emailNotSent")}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
            {t("insurance.insuredPersons", { count: submission.people.length })}
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {submission.people.map((person: InsurancePerson, index: number) => (
              <div
                key={person.id}
                className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                        {t("insurance.personN", { n: index + 1 })}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {format(new Date(person.createdAt), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <label className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                      <User className="w-3 h-3 sm:w-4 sm:h-4" />
                      {t("insurance.fullName")}
                    </label>
                    <p className="font-medium text-gray-900 mt-1 text-sm sm:text-base">
                      {person.fullName}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                      {t("insurance.phoneNumber")}
                    </label>
                    <p className="font-medium text-gray-900 mt-1 text-sm sm:text-base">
                      {person.phoneNumber}
                    </p>
                  </div>
                </div>

                {/* Date Range */}
                <div className="mb-3 sm:mb-4">
                  <label className="text-xs sm:text-sm text-gray-600 flex items-center gap-2 mb-2">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    {t("insurance.insurancePeriod")}
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {format(new Date(person.startDate), "dd/MM/yyyy")}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span>
                        {format(new Date(person.endDate), "dd/MM/yyyy")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {t("common.days", { count: person.totalDays })}
                    </p>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="mb-3 sm:mb-4">
                  <label className="text-xs sm:text-sm text-gray-600 flex items-center gap-2 mb-2">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                    {t("insurance.priceDetails")}
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("insurance.pricePerDayLabel")}</span>
                      <span className="font-medium">
                        ₾{Number(person.pricePerDay).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("insurance.baseAmount")}</span>
                      <span className="font-medium">
                        ₾{Number(person.baseAmount).toFixed(2)}
                      </span>
                    </div>
                    {person.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>{t("insurance.discountPercent", { percent: person.discount })}</span>
                        <span className="font-medium">
                          -₾
                          {(
                            (Number(person.baseAmount) * person.discount) /
                            100
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-semibold text-gray-900">
                        {t("insurance.finalAmountColon")}
                      </span>
                      <span className="font-semibold text-green-600 text-lg">
                        ₾{Number(person.finalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Passport Photo */}
                <div>
                  <label className="text-xs sm:text-sm text-gray-600 flex items-center gap-2 mb-2">
                    <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    {t("insurance.passportPhoto")}
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative w-full sm:w-40 h-40 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_BASE_URL}${person.passportPhoto}`}
                        alt={t("insurance.passportAlt", { name: person.fullName })}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <a
                        href={`${process.env.NEXT_PUBLIC_BASE_URL}${person.passportPhoto}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex-1 sm:flex-initial"
                      >
                        <ExternalLink size={16} />
                        {t("insurance.openNewWindow")}
                      </a>
                      <a
                        href={`${process.env.NEXT_PUBLIC_BASE_URL}${person.passportPhoto}`}
                        download
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex-1 sm:flex-initial"
                      >
                        <Download size={16} />
                        {t("insurance.download")}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="p-4 sm:p-6 border-t bg-gray-50">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
            {t("insurance.dates")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
            <div>
              <label className="text-gray-600 text-xs sm:text-sm">
                {t("insurance.createdAt")}
              </label>
              <p className="font-medium text-gray-900 mt-1">
                {format(new Date(submission.createdAt), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
            {submission.paidAt && (
              <div>
                <label className="text-gray-600 text-xs sm:text-sm">
                  {t("insurance.paidAt")}
                </label>
                <p className="font-medium text-green-600 mt-1">
                  {format(new Date(submission.paidAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            )}
            {submission.failedAt && (
              <div>
                <label className="text-gray-600 text-xs sm:text-sm">
                  {t("insurance.failedAt")}
                </label>
                <p className="font-medium text-red-600 mt-1">
                  {format(new Date(submission.failedAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            )}
            <div>
              <label className="text-gray-600 text-xs sm:text-sm">
                {t("insurance.updatedAt")}
              </label>
              <p className="font-medium text-gray-900 mt-1">
                {format(new Date(submission.updatedAt), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
