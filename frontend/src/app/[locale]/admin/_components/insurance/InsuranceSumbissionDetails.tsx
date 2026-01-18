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
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle size={18} />
            გადახდილი
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock size={18} />
            მიმდინარე
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-800">
            <XCircle size={18} />
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
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push(`${pathname}?insurance=all`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">
                შეკვეთის დეტალები
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                შეკვეთის ID: {submission.externalOrderId}
              </p>
            </div>
            {getStatusBadge(submission.status)}
          </div>
        </div>

        {/* Payment Info */}
        <div className="p-6 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            გადახდის ინფორმაცია
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">
                გამომგზავნის Email
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-gray-400" />
                <p className="font-medium text-gray-900">
                  {submission.submitterEmail}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">
                ადამიანების რაოდენობა
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-4 h-4 text-gray-400" />
                <p className="font-medium text-gray-900">
                  {submission.peopleCount} ადამიანი
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">
                ფასი თითო ადამიანზე
              </label>
              <p className="font-semibold text-lg text-gray-900 mt-1">
                ₾{submission.pricePerPerson}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">სულ თანხა</label>
              <p className="font-semibold text-2xl text-green-600 mt-1">
                ₾{submission.totalAmount}
              </p>
            </div>
            {submission.transactionId && (
              <div>
                <label className="text-sm text-gray-600">ტრანზაქციის ID</label>
                <p className="font-mono text-sm text-gray-900 mt-1">
                  {submission.transactionId}
                </p>
              </div>
            )}
            {submission.paymentMethod && (
              <div>
                <label className="text-sm text-gray-600">გადახდის მეთოდი</label>
                <p className="font-medium text-gray-900 mt-1">
                  {submission.paymentMethod}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Email Status */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            ელ.ფოსტის სტატუსი
          </h3>
          {submission.emailSent ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">
                  ელ.ფოსტა გაგზავნილია
                </p>
                <p className="text-sm text-green-700">
                  {format(
                    new Date(submission.emailSentAt!),
                    "dd MMMM yyyy, HH:mm"
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <XCircle className="w-5 h-5 text-gray-600" />
              <p className="font-medium text-gray-900">
                ელ.ფოსტა არ არის გაგზავნილი
              </p>
            </div>
          )}
        </div>

        {/* People Details */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            დაზღვეული პირები ({submission.people.length})
          </h3>
          <div className="space-y-4">
            {submission.people.map((person: any, index: number) => (
              <div
                key={person.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        პირი #{index + 1}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {format(new Date(person.createdAt), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-gray-600 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      სრული სახელი
                    </label>
                    <p className="font-medium text-gray-900 mt-1">
                      {person.fullName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      ტელეფონის ნომერი
                    </label>
                    <p className="font-medium text-gray-900 mt-1">
                      {person.phoneNumber}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                    <ImageIcon className="w-4 h-4" />
                    პასპორტის ფოტო
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_BASE_URL}${person.passportPhoto}`}
                        alt={`${person.fullName} - პასპორტი`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <a
                        href={`${process.env.NEXT_PUBLIC_BASE_URL}${person.passportPhoto}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <ExternalLink size={16} />
                        ახალ ფანჯარაში
                      </a>
                      <a
                        href={`${process.env.NEXT_PUBLIC_BASE_URL}${person.passportPhoto}`}
                        download
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
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
        <div className="p-6 border-t bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">თარიღები</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="text-gray-600">შექმნის თარიღი</label>
              <p className="font-medium text-gray-900 mt-1">
                {format(new Date(submission.createdAt), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
            {submission.paidAt && (
              <div>
                <label className="text-gray-600">გადახდის თარიღი</label>
                <p className="font-medium text-green-600 mt-1">
                  {format(new Date(submission.paidAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            )}
            {submission.failedAt && (
              <div>
                <label className="text-gray-600">წარუმატებლობის თარიღი</label>
                <p className="font-medium text-red-600 mt-1">
                  {format(new Date(submission.failedAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            )}
            <div>
              <label className="text-gray-600">ბოლო განახლება</label>
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
