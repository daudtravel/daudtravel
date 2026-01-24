"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import {
  ArrowLeft,
  Loader2,
  Save,
  DollarSign,
  Mail,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Percent,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import {
  useInsuranceSettings,
  useUpdateInsuranceSettings,
} from "@/src/hooks/insurance/useInsurance";

interface FormData {
  pricePerDay: string;
  discount30Days: string;
  discount90Days: string;
  adminEmail: string;
  isActive: boolean;
}

interface PriceExample {
  baseAmount: string;
  discountPercent: number;
  discountAmount: string;
  finalAmount: string;
}

export default function InsuranceSettings() {
  const router = useRouter();
  const pathname = usePathname();

  const { data: settingsData, isLoading } = useInsuranceSettings();
  const updateSettings = useUpdateInsuranceSettings();

  const [formData, setFormData] = useState<FormData>({
    pricePerDay: "",
    discount30Days: "",
    discount90Days: "",
    adminEmail: "",
    isActive: true,
  });

  useEffect(() => {
    if (settingsData?.data) {
      setFormData({
        pricePerDay: settingsData.data.pricePerDay.toString(),
        discount30Days: settingsData.data.discount30Days.toString(),
        discount90Days: settingsData.data.discount90Days.toString(),
        adminEmail: settingsData.data.adminEmail,
        isActive: settingsData.data.isActive,
      });
    }
  }, [settingsData]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const pricePerDay = parseFloat(formData.pricePerDay);
    const discount30 = parseFloat(formData.discount30Days);
    const discount90 = parseFloat(formData.discount90Days);

    if (isNaN(pricePerDay) || pricePerDay <= 0) {
      alert("გთხოვთ შეიყვანოთ სწორი ფასი დღეში");
      return;
    }

    if (isNaN(discount30) || discount30 < 0 || discount30 > 100) {
      alert("ფასდაკლება უნდა იყოს 0-დან 100-მდე");
      return;
    }

    if (isNaN(discount90) || discount90 < 0 || discount90 > 100) {
      alert("ფასდაკლება უნდა იყოს 0-დან 100-მდე");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/insurance/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            pricePerDay,
            discount30Days: discount30,
            discount90Days: discount90,
            adminEmail: formData.adminEmail,
            isActive: formData.isActive,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "განახლება ვერ მოხერხდა");
      }

      alert("პარამეტრები წარმატებით განახლდა");

      // Optionally refetch the settings
      if (updateSettings.reset) {
        updateSettings.reset();
      }
    } catch (error: any) {
      console.error("Error updating settings:", error);
      alert(`შეცდომა: ${error.message}`);
    }
  };

  const calculateExample = (days: number): PriceExample => {
    const price = parseFloat(formData.pricePerDay) || 0;
    const discount30 = parseFloat(formData.discount30Days) || 0;
    const discount90 = parseFloat(formData.discount90Days) || 0;

    const baseAmount = days * price;
    let discountPercent = 0;

    if (days >= 90 && discount90 > 0) {
      discountPercent = discount90;
    } else if (days >= 30 && discount30 > 0) {
      discountPercent = discount30;
    }

    const discountAmount = (baseAmount * discountPercent) / 100;
    const finalAmount = baseAmount - discountAmount;

    return {
      baseAmount: baseAmount.toFixed(2),
      discountPercent,
      discountAmount: discountAmount.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
    };
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-6">
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
                მართეთ დაზღვევის სისტემის პარამეტრები და ფასდაკლებები
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 sm:space-y-6"
        >
          {/* Price Per Day */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4" />
              ფასი დღეში (₾)
            </label>
            <input
              type="number"
              name="pricePerDay"
              step="0.01"
              min="0.01"
              value={formData.pricePerDay}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
              placeholder="1.50"
              required
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              ეს ფასი გამრავლდება დღეების რაოდენობაზე თითო ადამიანისთვის
            </p>
          </div>

          {/* Discount Settings */}
          <div className="space-y-4 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">ფასდაკლებები</h3>
            </div>

            {/* 30+ Days Discount */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                ფასდაკლება 30+ დღისთვის (%)
              </label>
              <input
                type="number"
                name="discount30Days"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount30Days}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10"
              />
              <p className="text-xs text-gray-500 mt-1">
                ეს ფასდაკლება გამოიყენება თუ პერიოდი 30 დღე ან მეტია
              </p>
            </div>

            {/* 90+ Days Discount */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                ფასდაკლება 90+ დღისთვის (%)
              </label>
              <input
                type="number"
                name="discount90Days"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount90Days}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="20"
              />
              <p className="text-xs text-gray-500 mt-1">
                ეს ფასდაკლება გამოიყენება თუ პერიოდი 90 დღე ან მეტია
              </p>
            </div>
          </div>

          {/* Admin Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4" />
              ადმინის ელ.ფოსტა
            </label>
            <input
              type="email"
              name="adminEmail"
              value={formData.adminEmail}
              onChange={handleInputChange}
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
                  setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
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

          {/* Pricing Examples */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-blue-900 mb-3 text-sm sm:text-base">
              ფასების მაგალითები
            </h3>
            <div className="space-y-3 text-xs sm:text-sm">
              {/* 10 days example */}
              <div className="bg-white rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">10 დღე:</span>
                  <span className="text-gray-500">ფასდაკლების გარეშე</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ბაზისური:</span>
                    <span>₾{calculateExample(10).baseAmount}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-blue-900">
                    <span>საბოლოო:</span>
                    <span>₾{calculateExample(10).finalAmount}</span>
                  </div>
                </div>
              </div>

              {/* 45 days example */}
              <div className="bg-white rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">45 დღე:</span>
                  <span className="text-green-600 font-medium">
                    -{calculateExample(45).discountPercent}% ფასდაკლება
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ბაზისური:</span>
                    <span>₾{calculateExample(45).baseAmount}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>ფასდაკლება:</span>
                    <span>-₾{calculateExample(45).discountAmount}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-blue-900">
                    <span>საბოლოო:</span>
                    <span>₾{calculateExample(45).finalAmount}</span>
                  </div>
                </div>
              </div>

              {/* 120 days example */}
              <div className="bg-white rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">120 დღე:</span>
                  <span className="text-green-600 font-medium">
                    -{calculateExample(120).discountPercent}% ფასდაკლება
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ბაზისური:</span>
                    <span>₾{calculateExample(120).baseAmount}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>ფასდაკლება:</span>
                    <span>-₾{calculateExample(120).discountAmount}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-blue-900">
                    <span>საბოლოო:</span>
                    <span>₾{calculateExample(120).finalAmount}</span>
                  </div>
                </div>
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
}
