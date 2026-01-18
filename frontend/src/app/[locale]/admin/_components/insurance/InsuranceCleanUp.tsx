"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  AlertTriangle,
  Calendar,
  TrendingDown,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import {
  useCleanupOldSubmissions,
  useCleanupAbandonedSubmissions,
} from "@/src/hooks/insurance/useInsurance";

export const InsuranceCleanup = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [oldMonths, setOldMonths] = useState("6");
  const [abandonedDays, setAbandonedDays] = useState("30");

  const cleanupOld = useCleanupOldSubmissions();
  const cleanupAbandoned = useCleanupAbandonedSubmissions();

  const handleCleanupOld = async () => {
    const months = parseInt(oldMonths);
    if (isNaN(months) || months < 1) {
      alert("გთხოვთ შეიყვანოთ სწორი თვეების რაოდენობა");
      return;
    }

    if (
      !confirm(
        `დარწმუნებული ხართ რომ გსურთ ${months} თვეზე ძველი გადახდილი შეკვეთების წაშლა?\n\nეს მოქმედება შეუქცევადია!`
      )
    ) {
      return;
    }

    try {
      const result = await cleanupOld.mutateAsync(months);
      alert(
        `წარმატებით წაიშალა ${result.deletedCount} შეკვეთა\n${result.failedCount > 0 ? `წარუმატებელი: ${result.failedCount}` : ""}`
      );
    } catch (error) {
      console.error("Error:", error);
      alert("შეცდომა გასუფთავებისას");
    }
  };

  const handleCleanupAbandoned = async () => {
    const days = parseInt(abandonedDays);
    if (isNaN(days) || days < 1) {
      alert("გთხოვთ შეიყვანოთ სწორი დღეების რაოდენობა");
      return;
    }

    if (
      !confirm(
        `დარწმუნებული ხართ რომ გსურთ ${days} დღეზე ძველი დაუსრულებელი შეკვეთების წაშლა?\n\nეს მოქმედება შეუქცევადია!`
      )
    ) {
      return;
    }

    try {
      const result = await cleanupAbandoned.mutateAsync(days);
      alert(
        `წარმატებით წაიშალა ${result.deletedCount} შეკვეთა\n${result.failedCount > 0 ? `წარუმატებელი: ${result.failedCount}` : ""}`
      );
    } catch (error) {
      console.error("Error:", error);
      alert("შეცდომა გასუფთავებისას");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
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
              <h2 className="text-2xl font-bold text-gray-800">
                მონაცემების გასუფთავება
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                წაშალეთ ძველი და დაუსრულებელი შეკვეთები
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-900">
              <p className="font-semibold mb-1">გაფრთხილება!</p>
              <p>
                ეს მოქმედებები შეუქცევადია. წაშლილი მონაცემების აღდგენა
                შეუძლებელია. გთხოვთ იყოთ ფრთხილად.
              </p>
            </div>
          </div>

          {/* Cleanup Old Paid */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  ძველი გადახდილი შეკვეთების წაშლა
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  წაშალეთ გადახდილი შეკვეთები რომლებიც X თვეზე მეტია ძველია
                </p>

                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      თვეების რაოდენობა
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={oldMonths}
                      onChange={(e) => setOldMonths(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="6"
                    />
                  </div>
                  <button
                    onClick={handleCleanupOld}
                    disabled={cleanupOld.isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {cleanupOld.isPending ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>მიმდინარეობს...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={20} />
                        <span>გასუფთავება</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cleanup Abandoned */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  დაუსრულებელი შეკვეთების წაშლა
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  წაშალეთ PENDING და FAILED შეკვეთები რომლებიც X დღეზე მეტია
                  ძველია
                </p>

                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      დღეების რაოდენობა
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={abandonedDays}
                      onChange={(e) => setAbandonedDays(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="30"
                    />
                  </div>
                  <button
                    onClick={handleCleanupAbandoned}
                    disabled={cleanupAbandoned.isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {cleanupAbandoned.isPending ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>მიმდინარეობს...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={20} />
                        <span>გასუფთავება</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              რეკომენდაციები:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>გადახდილი შეკვეთები: 6 თვეზე მეტი</li>
              <li>დაუსრულებელი შეკვეთები: 30 დღეზე მეტი</li>
              <li>გაუშვით გასუფთავება თვეში ერთხელ</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
