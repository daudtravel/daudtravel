// src/components/admin/insurance/InsuranceSubmissionDetails.tsx

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
} from "lucide-react";
import { format } from "date-fns";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useInsuranceSubmission } from "@/src/hooks/insurance/useInsurance";
import Image from "next/image";

export const InsuranceSubmissionDetails = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("insurance");

  const { data: submissionData, isLoading } = useInsuranceSubmission(
    submissionId || ""
  );

  const submission = submissionData?.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
            გადახდილი
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
            მიმდინარე
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-red-100 text-red-800">
            <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
            წარუმატებელი
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
      <div className="text-center py-12 text-red-600">შეკვეთა არ მოიძებნა</div>
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                შეკვეთის დეტალები
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm mt-1 truncate">
                შეკვეთის ID: {submission.externalOrderId}
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
            გადახდის ინფორმაცია
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs sm:text-sm text-gray-600">
                გამომგზავნის Email
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
                ადამიანების რაოდენობა
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="font-medium text-gray-900 text-sm sm:text-base">
                  {submission.peopleCount} ადამიანი
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs sm:text-sm text-gray-600">
                ფასი თითო ადამიანზე
              </label>
              <p className="font-semibold text-base sm:text-lg text-gray-900 mt-1">
                ₾{submission.pricePerPerson}
              </p>
            </div>
            <div>
              <label className="text-xs sm:text-sm text-gray-600">
                სულ თანხა
              </label>
              <p className="font-semibold text-xl sm:text-2xl text-green-600 mt-1">
                ₾{submission.totalAmount}
              </p>
            </div>
            {submission.transactionId && (
              <div className="sm:col-span-2">
                <label className="text-xs sm:text-sm text-gray-600">
                  ტრანზაქციის ID
                </label>
                <p className="font-mono text-xs sm:text-sm text-gray-900 mt-1 break-all">
                  {submission.transactionId}
                </p>
              </div>
            )}
            {submission.paymentMethod && (
              <div>
                <label className="text-xs sm:text-sm text-gray-600">
                  გადახდის მეთოდი
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
            ელ.ფოსტის სტატუსი
          </h3>
          {submission.emailSent ? (
            <div className="flex items-start gap-3 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium text-green-900 text-sm sm:text-base">
                  ელ.ფოსტა გაგზავნილია
                </p>
                <p className="text-xs sm:text-sm text-green-700 break-all">
                  {format(
                    new Date(submission.emailSentAt!),
                    "dd MMMM yyyy, HH:mm"
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <XCircle className="w-5 h-5 text-gray-600 flex-shrink-0" />
              <p className="font-medium text-gray-900 text-sm sm:text-base">
                ელ.ფოსტა არ არის გაგზავნილი
              </p>
            </div>
          )}
        </div>

        {/* People Details */}
        <div className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
            დაზღვეული პირები ({submission.people.length})
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {submission.people.map((person: any, index: number) => (
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
                        პირი #{index + 1}
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
                      სრული სახელი
                    </label>
                    <p className="font-medium text-gray-900 mt-1 text-sm sm:text-base">
                      {person.fullName}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                      ტელეფონის ნომერი
                    </label>
                    <p className="font-medium text-gray-900 mt-1 text-sm sm:text-base">
                      {person.phoneNumber}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm text-gray-600 flex items-center gap-2 mb-2">
                    <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    პასპორტის ფოტო
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative w-full sm:w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_BASE_URL}${person.passportPhoto}`}
                        alt={`${person.fullName} - პასპორტი`}
                        fill
                        className="object-cover"
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
                        ახალ ფანჯარაში
                      </a>
                      <a
                        href={`${process.env.NEXT_PUBLIC_BASE_URL}${person.passportPhoto}`}
                        download
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex-1 sm:flex-initial"
                      >
                        <Download size={16} />
                        გადმოწერა
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
            თარიღები
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
            <div>
              <label className="text-gray-600 text-xs sm:text-sm">
                შექმნის თარიღი
              </label>
              <p className="font-medium text-gray-900 mt-1">
                {format(new Date(submission.createdAt), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
            {submission.paidAt && (
              <div>
                <label className="text-gray-600 text-xs sm:text-sm">
                  გადახდის თარიღი
                </label>
                <p className="font-medium text-green-600 mt-1">
                  {format(new Date(submission.paidAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            )}
            {submission.failedAt && (
              <div>
                <label className="text-gray-600 text-xs sm:text-sm">
                  წარუმატებლობის თარიღი
                </label>
                <p className="font-medium text-red-600 mt-1">
                  {format(new Date(submission.failedAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            )}
            <div>
              <label className="text-gray-600 text-xs sm:text-sm">
                ბოლო განახლება
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
