"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { format } from "date-fns";
import { useRouter, usePathname } from "next/navigation";
import {
  useInsuranceSubmissions,
  useDeleteInsuranceSubmission,
} from "@/src/hooks/insurance/useInsurance";

export const InsuranceSubmissionsList = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );

  const { data: submissionsData, isLoading } = useInsuranceSubmissions(
    statusFilter,
    page,
    50
  );
  const deleteSubmission = useDeleteInsuranceSubmission();

  const submissions = submissionsData?.data || [];
  const pagination = submissionsData?.pagination;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={14} />
            <span className="hidden sm:inline">გადახდილი</span>
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock size={14} />
            <span className="hidden sm:inline">მიმდინარე</span>
          </span>
        );
      case "FAILED":
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

  const handleViewDetails = (submissionId: string) => {
    router.push(`${pathname}?insurance=${submissionId}`);
  };

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
                setStatusFilter(e.target.value || undefined);
                setPage(1);
              }}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">ყველა სტატუსი</option>
              <option value="PAID">გადახდილი</option>
              <option value="PENDING">მიმდინარე</option>
              <option value="FAILED">წარუმატებელი</option>
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
                      ადამიანების რაოდენობა
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      ფასი/ადამიანი
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      სულ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      სტატუსი
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      ელ.ფოსტა გაგზავნილია
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
                  {submissions.map((submission: any) => (
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
                        <span className="text-gray-700">
                          ₾{submission.pricePerPerson}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-semibold text-green-600">
                          ₾{submission.totalAmount}
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
                            onClick={() => handleViewDetails(submission.id)}
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
              {submissions.map((submission: any) => (
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
                      <p className="text-xs text-gray-500 mb-1">
                        ფასი/ადამიანი
                      </p>
                      <span className="text-sm text-gray-700">
                        ₾{submission.pricePerPerson}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">სულ</p>
                      <span className="text-lg font-semibold text-green-600">
                        ₾{submission.totalAmount}
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
                      onClick={() => handleViewDetails(submission.id)}
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
    </div>
  );
};
