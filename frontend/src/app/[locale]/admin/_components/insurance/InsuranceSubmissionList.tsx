"use client";

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Mail,
  Users,
  Trash2,
  Settings,
  Eye,
  Calendar,
  DollarSign,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter, usePathname } from "next/navigation";
import {
  useInsuranceSubmissions,
  useDeleteInsuranceSubmission,
} from "@/src/hooks/insurance/useInsurance";

import Image from "next/image";
import {
  InsurancePerson,
  InsuranceSubmission,
  PaymentStatus,
} from "@/src/types/insurance.types";

export default function InsuranceSubmissionsList() {
  const router = useRouter();
  const pathname = usePathname();
  const [page, setPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>(
    undefined
  );
  const [selectedSubmission, setSelectedSubmission] =
    useState<InsuranceSubmission | null>(null);

  const { data: submissionsData, isLoading } = useInsuranceSubmissions(
    statusFilter,
    page,
    50
  );
  const deleteSubmission = useDeleteInsuranceSubmission();

  const submissions = submissionsData?.data || [];
  const pagination = submissionsData?.pagination;

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={14} />
            <span className="hidden sm:inline">გადახდილი</span>
          </span>
        );
      case PaymentStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock size={14} />
            <span className="hidden sm:inline">მიმდინარე</span>
          </span>
        );
      case PaymentStatus.FAILED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle size={14} />
            <span className="hidden sm:inline">წარუმატებელი</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const handleDelete = async (submissionId: string, email: string) => {
    if (
      confirm(
        `დარწმუნებული ხართ რომ გსურთ ${email}-ის შეკვეთის წაშლა?\n\nყველა პასპორტის ფოტო და მონაცემი წაიშლება!`
      )
    ) {
      try {
        await deleteSubmission.mutateAsync(submissionId);
        alert("წარმატებით წაიშალა");
      } catch (error) {
        console.error("Error deleting:", error);
        alert("შეცდომა წაშლისას");
      }
    }
  };

  const SubmissionDetails = ({
    submission,
  }: {
    submission: InsuranceSubmission;
  }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-white border-b p-4 sm:p-6 flex justify-between items-center rounded-t-lg">
          <div>
            <h3 className="text-xl font-bold">შეკვეთის დეტალები</h3>
            <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
              {submission.externalOrderId}
            </code>
          </div>
          <button
            onClick={() => setSelectedSubmission(null)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">სტატუსი</p>
                {getStatusBadge(submission.status)}
              </div>
              <div>
                <p className="text-gray-600 mb-1">ადამიანები</p>
                <p className="font-semibold">{submission.peopleCount}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">სულ დღეები</p>
                <p className="font-semibold">{submission.totalDays}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">სულ თანხა</p>
                <p className="font-semibold text-green-600 text-lg">
                  ₾{Number(submission.totalAmount).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* People Details */}
          <div>
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Users size={20} />
              ადამიანების დეტალები
            </h4>
            <div className="space-y-4">
              {submission.people.map(
                (person: InsurancePerson, index: number) => (
                  <div
                    key={person.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-semibold text-gray-900">
                          {person.fullName}
                        </h5>
                        <p className="text-sm text-gray-600">
                          {person.phoneNumber}
                        </p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Passport Photo */}
                    <div className="mb-4">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <Image
                          src={`${process.env.NEXT_PUBLIC_BASE_URL}${person.passportPhoto}`}
                          alt={`${person.fullName} - პასპორტი`}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Calendar size={14} />
                          <span>პერიოდი</span>
                        </div>
                        <p className="font-medium">
                          {format(new Date(person.startDate), "dd/MM/yyyy")} -{" "}
                          {format(new Date(person.endDate), "dd/MM/yyyy")}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {person.totalDays} დღე
                        </p>
                      </div>

                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <DollarSign size={14} />
                          <span>ფასი</span>
                        </div>
                        <p className="font-medium">
                          ₾{Number(person.pricePerDay).toFixed(2)} / დღე
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ბაზისური: ₾{Number(person.baseAmount).toFixed(2)}
                        </p>
                      </div>

                      {person.discount > 0 && (
                        <div className="bg-green-50 p-3 rounded">
                          <div className="text-green-700 mb-1">ფასდაკლება</div>
                          <p className="font-medium text-green-800">
                            -{person.discount}%
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            -₾
                            {(
                              (Number(person.baseAmount) *
                                Number(person.discount)) /
                              100
                            ).toFixed(2)}
                          </p>
                        </div>
                      )}

                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-blue-700 mb-1">საბოლოო თანხა</div>
                        <p className="font-bold text-blue-900 text-lg">
                          ₾{Number(person.finalAmount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">კონტაქტი</h4>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail size={16} />
              <span>{submission.submitterEmail}</span>
            </div>
            {submission.emailSent && submission.emailSentAt && (
              <p className="text-xs text-green-600 mt-2">
                <CheckCircle size={12} className="inline mr-1" />
                ელ.ფოსტა გაგზავნილია:{" "}
                {format(new Date(submission.emailSentAt), "dd/MM/yyyy HH:mm")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 sm:p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                დაზღვევის შეკვეთები
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                სულ: {pagination?.total || 0} შეკვეთა
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push(`${pathname}?insurance=settings`)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Settings size={18} />
                <span className="hidden sm:inline">პარამეტრები</span>
              </button>
            </div>
          </div>

          <div className="mt-4">
            <select
              value={statusFilter || ""}
              onChange={(e) => {
                setStatusFilter((e.target.value as PaymentStatus) || undefined);
                setPage(1);
              }}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">ყველა სტატუსი</option>
              <option value={PaymentStatus.PAID}>გადახდილი</option>
              <option value={PaymentStatus.PENDING}>მიმდინარე</option>
              <option value={PaymentStatus.FAILED}>წარუმატებელი</option>
            </select>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">შეკვეთები არ მოიძებნა</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      გამომგზავნი
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      ადამიანები
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      სულ დღეები
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      თანხა
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      სტატუსი
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      ელ.ფოსტა
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      თარიღი
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      მოქმედებები
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {submissions.map((submission: InsuranceSubmission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {submission.submitterEmail}
                            </p>
                            <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {submission.externalOrderId}
                            </code>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-500" />
                          <span className="font-semibold text-lg text-gray-900">
                            {submission.peopleCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-purple-500" />
                          <span className="font-semibold text-gray-900">
                            {submission.totalDays}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-semibold text-green-600">
                          ₾{Number(submission.totalAmount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="px-6 py-4">
                        {submission.emailSent ? (
                          <div className="text-sm">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle size={12} />
                              კი
                            </span>
                            {submission.emailSentAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                {format(
                                  new Date(submission.emailSentAt),
                                  "dd/MM/yyyy HH:mm"
                                )}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <XCircle size={12} />
                            არა
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {submission.paidAt ? (
                          <div>
                            <div className="font-medium text-green-600">
                              {format(
                                new Date(submission.paidAt),
                                "dd/MM/yyyy"
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(submission.paidAt), "HH:mm")}
                            </div>
                          </div>
                        ) : submission.failedAt ? (
                          <div>
                            <div className="font-medium text-red-600">
                              {format(
                                new Date(submission.failedAt),
                                "dd/MM/yyyy"
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(submission.failedAt), "HH:mm")}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">
                              {format(
                                new Date(submission.createdAt),
                                "dd/MM/yyyy"
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(submission.createdAt), "HH:mm")}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedSubmission(submission)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="დეტალები"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(
                                submission.id,
                                submission.submitterEmail
                              )
                            }
                            disabled={deleteSubmission.isPending}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="წაშლა"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {submissions.map((submission: InsuranceSubmission) => (
                <div key={submission.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {submission.submitterEmail}
                        </p>
                      </div>
                      <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded block w-fit">
                        {submission.externalOrderId}
                      </code>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ადამიანები</p>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-gray-900">
                          {submission.peopleCount}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">სულ დღეები</p>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span className="font-semibold text-gray-900">
                          {submission.totalDays}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-1">სულ თანხა</p>
                      <span className="text-lg font-semibold text-green-600">
                        ₾{Number(submission.totalAmount).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ელ.ფოსტა</p>
                      {submission.emailSent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle size={12} />
                          კი
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XCircle size={12} />
                          არა
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">თარიღი</p>
                    <div className="text-sm text-gray-600">
                      {submission.paidAt ? (
                        <span className="text-green-600">
                          {format(
                            new Date(submission.paidAt),
                            "dd/MM/yyyy HH:mm"
                          )}
                        </span>
                      ) : submission.failedAt ? (
                        <span className="text-red-600">
                          {format(
                            new Date(submission.failedAt),
                            "dd/MM/yyyy HH:mm"
                          )}
                        </span>
                      ) : (
                        format(
                          new Date(submission.createdAt),
                          "dd/MM/yyyy HH:mm"
                        )
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      <Eye size={16} />
                      დეტალები
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(submission.id, submission.submitterEmail)
                      }
                      disabled={deleteSubmission.isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 text-sm"
                    >
                      <Trash2 size={16} />
                      წაშლა
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 sm:px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  წინა
                </button>
                <span className="text-xs sm:text-sm text-gray-600">
                  გვერდი {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="px-3 sm:px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  შემდეგი
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedSubmission && (
        <SubmissionDetails submission={selectedSubmission} />
      )}
    </div>
  );
}
