"use client";

import React from "react";
import {
  ArrowLeft,
  Loader2,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  ImageIcon,
  BarChart3,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useInsuranceStats } from "@/src/hooks/insurance/useInsurance";

export const InsuranceStats = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: statsData, isLoading } = useInsuranceStats();

  const stats = statsData?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`${pathname}?insurance=all`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">სტატისტიკა</h2>
              <p className="text-gray-600 text-sm mt-1">
                დაზღვევის სისტემის სტატისტიკა და მონაცემები
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Submissions Stats */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              შეკვეთების სტატისტიკა
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">
                    {stats?.submissions.total || 0}
                  </span>
                </div>
                <p className="text-blue-100 text-sm">სულ შეკვეთა</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">
                    {stats?.submissions.paid || 0}
                  </span>
                </div>
                <p className="text-green-100 text-sm">გადახდილი</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">
                    {stats?.submissions.pending || 0}
                  </span>
                </div>
                <p className="text-yellow-100 text-sm">მიმდინარე</p>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <XCircle className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">
                    {stats?.submissions.failed || 0}
                  </span>
                </div>
                <p className="text-red-100 text-sm">წარუმატებელი</p>
              </div>
            </div>
          </div>

          {/* Storage Stats */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              მეხსიერების სტატისტიკა
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-purple-600" />
                  <span className="text-4xl font-bold text-purple-900">
                    {stats?.totalPeople || 0}
                  </span>
                </div>
                <p className="text-purple-700 font-medium">
                  სულ დაზღვეული ადამიანი
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <ImageIcon className="w-8 h-8 text-orange-600" />
                  <span className="text-4xl font-bold text-orange-900">
                    {stats?.estimatedStorageFiles || 0}
                  </span>
                </div>
                <p className="text-orange-700 font-medium">პასპორტის ფოტოები</p>
                <p className="text-sm text-orange-600 mt-1">
                  დაახლოებით ~
                  {((stats?.estimatedStorageFiles || 0) * 0.3).toFixed(0)} MB
                </p>
              </div>
            </div>
          </div>

          {/* Percentages */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              კონვერსიის მაჩვენებლები
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700">გადახდის პროცენტი</span>
                  <span className="font-semibold text-green-600">
                    {stats?.submissions.total
                      ? (
                          (stats.submissions.paid / stats.submissions.total) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 rounded-full h-2 transition-all"
                    style={{
                      width: `${stats?.submissions.total ? (stats.submissions.paid / stats.submissions.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700">წარუმატებლობის პროცენტი</span>
                  <span className="font-semibold text-red-600">
                    {stats?.submissions.total
                      ? (
                          (stats.submissions.failed / stats.submissions.total) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 rounded-full h-2 transition-all"
                    style={{
                      width: `${stats?.submissions.total ? (stats.submissions.failed / stats.submissions.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
