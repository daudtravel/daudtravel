// src/components/admin/insurance/InsuranceSettings.tsx

"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  Save,
  DollarSign,
  Mail,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import {
  useInsuranceSettings,
  useUpdateInsuranceSettings,
} from "@/src/hooks/insurance/useInsurance";

export const InsuranceSettings = () => {
  const router = useRouter();
  const pathname = usePathname();

  const { data: settingsData, isLoading } = useInsuranceSettings();
  const updateSettings = useUpdateInsuranceSettings();

  const [formData, setFormData] = useState({
    pricePerPerson: "",
    adminEmail: "",
    isActive: true,
  });

  useEffect(() => {
    if (settingsData?.data) {
      setFormData({
        pricePerPerson: settingsData.data.pricePerPerson.toString(),
        adminEmail: settingsData.data.adminEmail,
        isActive: settingsData.data.isActive,
      });
    }
  }, [settingsData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(formData.pricePerPerson);
    if (isNaN(price) || price <= 0) {
      alert("გთხოვთ შეიყვანოთ სწორი ფასი");
      return;
    }

    try {
      await updateSettings.mutateAsync({
        pricePerPerson: price,
        adminEmail: formData.adminEmail,
        isActive: formData.isActive,
      });
      alert("პარამეტრები წარმატებით განახლდა");
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("შეცდომა პარამეტრების განახლებისას");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-4">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.push(`${pathname}?insurance=all`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                დაზღვევის პარამეტრები
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                მართეთ დაზღვევის სისტემის პარამეტრები
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 sm:space-y-6"
        >
          {/* Price Per Person */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4" />
              ფასი თითო ადამიანზე (₾)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.pricePerPerson}
              onChange={(e) =>
                setFormData({ ...formData, pricePerPerson: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
              placeholder="1.00"
              required
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              ეს ფასი გამოყენებული იქნება თითო ადამიანზე გაანგარიშებისთვის
            </p>
          </div>

          {/* Admin Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4" />
              ადმინის ელ.ფოსტა
            </label>
            <input
              type="email"
              value={formData.adminEmail}
              onChange={(e) =>
                setFormData({ ...formData, adminEmail: e.target.value })
              }
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="admin@daudtravel.com"
              required
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              ამ ელ.ფოსტაზე გაიგზავნება შეტყობინებები გადახდილი შეკვეთების
              შესახებ
            </p>
          </div>

          {/* Service Status */}
          <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  სერვისის სტატუსი
                </label>
                <p className="text-xs sm:text-sm text-gray-500">
                  {formData.isActive
                    ? "დაზღვევის სისტემა აქტიურია და მომხმარებლები შეძლებენ შეკვეთის გაკეთებას"
                    : "დაზღვევის სისტემა გამორთულია, შეკვეთები არ მიიღება"}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, isActive: !formData.isActive })
                }
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto ${
                  formData.isActive
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {formData.isActive ? (
                  <>
                    <ToggleRight size={20} />
                    <span className="font-medium text-sm">აქტიური</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft size={20} />
                    <span className="font-medium text-sm">გამორთული</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Current Settings Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">
              მიმდინარე პარამეტრები
            </h3>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">ფასი 1 ადამიანზე:</span>
                <span className="font-semibold text-blue-900">
                  ₾{formData.pricePerPerson}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">ფასი 3 ადამიანზე:</span>
                <span className="font-semibold text-blue-900">
                  ₾{(parseFloat(formData.pricePerPerson) * 3).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">ფასი 5 ადამიანზე:</span>
                <span className="font-semibold text-blue-900">
                  ₾{(parseFloat(formData.pricePerPerson) * 5).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={updateSettings.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
            >
              {updateSettings.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>მიმდინარეობს შენახვა...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>პარამეტრების შენახვა</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push(`${pathname}?insurance=all`)}
              disabled={updateSettings.isPending}
              className="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
            >
              გაუქმება
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
