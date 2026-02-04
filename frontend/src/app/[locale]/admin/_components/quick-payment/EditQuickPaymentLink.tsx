"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Upload, X, ArrowLeft, Languages, Plus } from "lucide-react";
import Image from "next/image";
import { useUpdateQuickLink } from "@/src/hooks/quick-payment/useQuickPayment";
import { quickPaymentService } from "@/src/services/quick-payment.service";

const getImageUrl = (imagePath: string | null): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http") || imagePath.startsWith("data:")) {
    return imagePath;
  }
  return `${process.env.NEXT_PUBLIC_BASE_URL}${imagePath}`;
};

interface Localization {
  locale: string;
  name: string;
  description: string;
}

const AVAILABLE_LOCALES = [
  { code: "ka", label: "ქართული", flag: "🇬🇪", required: true },
  { code: "en", label: "English", flag: "🇬🇧", required: false },
  { code: "ru", label: "Русский", flag: "🇷🇺", required: false },
  { code: "ar", label: "العربية", flag: "🇸🇦", required: false },
  { code: "tr", label: "Türkçe", flag: "🇹🇷", required: false },
];

function EditQuickLinkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("quickPayment");

  const [loading, setLoading] = useState(true);
  const [localizations, setLocalizations] = useState<Localization[]>([
    { locale: "ka", name: "", description: "" },
  ]);
  const [price, setPrice] = useState("");
  const [showOnWebsite, setShowOnWebsite] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [newImageBase64, setNewImageBase64] = useState<string>("");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const updateLink = useUpdateQuickLink();

  useEffect(() => {
    if (slug && slug !== "create" && slug !== "orders" && slug !== "all") {
      loadLinkData();
    } else {
      setLoading(false);
    }
  }, [slug]);

  const loadLinkData = async () => {
    try {
      setLoading(true);
      const response = await quickPaymentService.getAuthenticatedLink(slug!);
      const link = response.data;

      // ✅ FIXED: Better handling of localizations
      if (
        link.localizations &&
        Array.isArray(link.localizations) &&
        link.localizations.length > 0
      ) {
        // Ensure all localizations have valid data
        const validLocalizations = link.localizations
          .filter((loc: any) => loc.name && loc.name.trim())
          .map((loc: any) => ({
            locale: loc.locale,
            name: loc.name,
            description: loc.description || "", // ✅ Convert null to empty string
          }));

        if (validLocalizations.length > 0) {
          setLocalizations(validLocalizations);
        } else {
          console.error("No valid localizations found");
          alert("პროდუქტს არ აქვს ვალიდური თარგმანები");
          router.push("/admin?quickPayment=all");
          return;
        }
      } else {
        console.error("Invalid localizations structure:", link.localizations);
        alert("პროდუქტს არ აქვს თარგმანები");
        router.push("/admin?quickPayment=all");
        return;
      }

      setPrice(link.price?.toString() || "");
      setShowOnWebsite(link.showOnWebsite || false);

      const imageUrl = getImageUrl(link.image);
      setExistingImage(imageUrl);
      setImagePreview(imageUrl);
    } catch (error: any) {
      console.error("Error loading link:", error);
      alert(
        error?.response?.data?.message || "შეცდომა მონაცემების ჩატვირთვისას"
      );
      router.push("/admin?quickPayment=all");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Better validation for localization changes
  const handleLocalizationChange = (
    locale: string,
    field: "name" | "description",
    value: string
  ) => {
    setLocalizations((prev) =>
      prev.map((loc) =>
        loc.locale === locale ? { ...loc, [field]: value } : loc
      )
    );
  };

  // ✅ FIXED: Better duplicate detection
  const addLocalization = (locale: string) => {
    // Check if already exists
    const exists = localizations.some((loc) => loc.locale === locale);
    if (exists) {
      alert("ეს ენა უკვე დამატებულია");
      return;
    }

    // Add new localization with empty values
    setLocalizations((prev) => [
      ...prev,
      { locale, name: "", description: "" },
    ]);
    setShowLanguageDropdown(false);
  };

  const removeLocalization = (locale: string) => {
    const localeConfig = AVAILABLE_LOCALES.find((l) => l.code === locale);
    if (localeConfig?.required) {
      alert(`${localeConfig.label} ენა სავალდებულოა`);
      return;
    }

    // ✅ FIXED: Don't allow removing if it's the only localization
    if (localizations.length === 1) {
      alert("მინიმუმ ერთი ენა უნდა იყოს დამატებული");
      return;
    }

    setLocalizations((prev) => prev.filter((loc) => loc.locale !== locale));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setNewImageBase64(base64String);
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setNewImageBase64("");
    setImagePreview(existingImage);
  };

  // ✅ FIXED: Better validation before submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate Georgian localization exists
    const georgianLoc = localizations.find((loc) => loc.locale === "ka");
    if (!georgianLoc || !georgianLoc.name.trim()) {
      alert("ქართული სახელი სავალდებულოა");
      return;
    }

    // Validate price
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      alert("გთხოვთ შეიყვანოთ სწორი ფასი");
      return;
    }

    // ✅ FIXED: Filter out localizations with empty names
    const validLocalizations = localizations.filter((loc) => loc.name.trim());

    if (validLocalizations.length === 0) {
      alert("მინიმუმ ერთი ენა უნდა იყოს შევსებული");
      return;
    }

    // Check for duplicate locales
    const locales = validLocalizations.map((loc) => loc.locale);
    const uniqueLocales = new Set(locales);
    if (locales.length !== uniqueLocales.size) {
      alert("ორი ერთნაირი ენა არ შეიძლება იყოს დამატებული");
      return;
    }

    try {
      const submitData: any = {
        localizations: validLocalizations.map((loc) => ({
          locale: loc.locale,
          name: loc.name.trim(),
          // ✅ FIXED: Send null instead of empty string if description is empty
          description: loc.description.trim() || undefined,
        })),
        price: priceValue,
        showOnWebsite,
      };

      // Only include image if a new one was uploaded
      if (newImageBase64) {
        submitData.image = newImageBase64;
      }

      console.log("📤 Submitting update:", submitData);

      await updateLink.mutateAsync({ slug: slug!, data: submitData });
      alert("ლინკი წარმატებით განახლდა");
      router.push("/admin?quickPayment=all");
    } catch (error: any) {
      console.error("❌ Error updating link:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "შეცდომა ლინკის განახლებისას";
      alert(errorMessage);
    }
  };

  const handleCancel = () => {
    router.push("/admin?quickPayment=all");
  };

  const addedLocales = localizations.map((loc) => loc.locale);
  const availableToAdd = AVAILABLE_LOCALES.filter(
    (loc) => !addedLocales.includes(loc.code)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-4xl">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              ლინკის რედაქტირება
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              მრავალენოვანი პროდუქტის რედაქტირება
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Localizations Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-blue-100">
              <div className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  ენები და თარგმანები
                </h3>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                  {localizations.length}/{AVAILABLE_LOCALES.length}
                </span>
              </div>
              {availableToAdd.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setShowLanguageDropdown(!showLanguageDropdown)
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm text-sm font-medium"
                  >
                    <Plus size={16} />
                    <span>ენის დამატება</span>
                  </button>
                  {showLanguageDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowLanguageDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
                        {availableToAdd.map((locale) => (
                          <button
                            key={locale.code}
                            type="button"
                            onClick={() => addLocalization(locale.code)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 text-sm transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <span className="text-2xl">{locale.flag}</span>
                            <span className="font-medium text-gray-700">
                              {locale.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {localizations.map((loc, index) => {
                const localeInfo = AVAILABLE_LOCALES.find(
                  (l) => l.code === loc.locale
                );
                return (
                  <div
                    key={loc.locale}
                    className="border-2 border-gray-200 rounded-xl p-4 sm:p-5 space-y-4 hover:border-blue-200 transition-colors bg-gradient-to-br from-gray-50 to-white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{localeInfo?.flag}</span>
                        <div>
                          <span className="font-semibold text-gray-800 text-lg">
                            {localeInfo?.label}
                          </span>
                          {localeInfo?.required && (
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                              სავალდებულო
                            </span>
                          )}
                        </div>
                      </div>
                      {!localeInfo?.required && (
                        <button
                          type="button"
                          onClick={() => removeLocalization(loc.locale)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        პროდუქტის სახელი{" "}
                        {localeInfo?.required && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={loc.name}
                        onChange={(e) =>
                          handleLocalizationChange(
                            loc.locale,
                            "name",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                        placeholder={`პროდუქტის სახელი ${localeInfo?.label}-ად`}
                        required={localeInfo?.required}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        აღწერა (არასავალდებულო)
                      </label>
                      <textarea
                        value={loc.description}
                        onChange={(e) =>
                          handleLocalizationChange(
                            loc.locale,
                            "description",
                            e.target.value
                          )
                        }
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all text-sm sm:text-base"
                        placeholder={`პროდუქტის აღწერა ${localeInfo?.label}-ად`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ფასი (₾) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
              placeholder="0.00"
              required
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              სურათი
            </label>

            {imagePreview ? (
              <div className="space-y-3">
                <div className="relative inline-block w-full sm:w-64">
                  <div className="relative w-full sm:w-64 h-64 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized={imagePreview.startsWith("data:") || false}
                    />
                  </div>
                  {newImageBase64 && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                    <Upload size={16} />
                    <span>სურათის შეცვლა</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500 font-medium">
                  ატვირთეთ სურათი
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  მაქსიმალური ზომა: 5MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Show on Website Toggle */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
            <input
              type="checkbox"
              id="showOnWebsite"
              checked={showOnWebsite}
              onChange={(e) => setShowOnWebsite(e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="showOnWebsite"
              className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
            >
              გამოჩნდეს ვებსაიტზე (საჯარო პროდუქტი)
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2">
            <button
              type="submit"
              disabled={updateLink.isPending}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md"
            >
              {updateLink.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>მიმდინარეობს...</span>
                </>
              ) : (
                <span>განახლება</span>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={updateLink.isPending}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 font-semibold"
            >
              გაუქმება
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const EditQuickLink = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="animate-spin" size={40} />
        </div>
      }
    >
      <EditQuickLinkContent />
    </Suspense>
  );
};
