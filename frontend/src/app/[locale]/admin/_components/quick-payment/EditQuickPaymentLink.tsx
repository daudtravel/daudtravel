"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Upload, X, ArrowLeft, Globe, Languages } from "lucide-react";
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

export const EditQuickLink = () => {
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

  const updateLink = useUpdateQuickLink();

  useEffect(() => {
    if (slug && slug !== "create" && slug !== "orders" && slug !== "all") {
      loadLinkData();
    }
  }, [slug]);

  const loadLinkData = async () => {
    try {
      setLoading(true);
      const response = await quickPaymentService.getLink(slug!);
      const link = response.data;

      // Load existing localizations or create default
      if (link.localizations && link.localizations.length > 0) {
        setLocalizations(link.localizations);
      } else {
        // Fallback for old data structure
        setLocalizations([
          {
            locale: "ka",
            name: link.name || "",
            description: link.description || "",
          },
        ]);
      }

      setPrice(link.price.toString());
      setShowOnWebsite(link.showOnWebsite || false);

      const imageUrl = getImageUrl(link.image);
      setExistingImage(imageUrl);
      setImagePreview(imageUrl);
    } catch (error) {
      console.error("Error loading link:", error);
      alert("შეცდომა მონაცემების ჩატვირთვისას");
      router.back();
    } finally {
      setLoading(false);
    }
  };

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

  const addLocalization = (locale: string) => {
    if (localizations.some((loc) => loc.locale === locale)) {
      alert("ეს ენა უკვე დამატებულია");
      return;
    }
    setLocalizations([...localizations, { locale, name: "", description: "" }]);
  };

  const removeLocalization = (locale: string) => {
    if (locale === "ka") {
      alert("ქართული ენა სავალდებულოა");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate Georgian localization (required)
    const georgianLoc = localizations.find((loc) => loc.locale === "ka");
    if (!georgianLoc || !georgianLoc.name.trim()) {
      alert("ქართული სახელი სავალდებულოა");
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      alert("გთხოვთ შეიყვანოთ სწორი ფასი");
      return;
    }

    try {
      const submitData: any = {
        localizations: localizations
          .filter((loc) => loc.name.trim()) // Only include localizations with names
          .map((loc) => ({
            locale: loc.locale,
            name: loc.name.trim(),
            description: loc.description.trim() || undefined,
          })),
        price: priceValue,
        showOnWebsite,
      };

      if (newImageBase64) {
        submitData.image = newImageBase64;
      }

      await updateLink.mutateAsync({ slug: slug!, data: submitData });
      alert("ლინკი წარმატებით განახლდა");
      router.push("/admin?quickPayment=all");
    } catch (error: any) {
      console.error("Error updating link:", error);
      alert(error.response?.data?.message || "შეცდომა ლინკის განახლებისას");
    }
  };

  const handleCancel = () => {
    router.push("/admin?quickPayment=all");
  };

  const availableLocales = [
    { code: "ka", label: "ქართული", flag: "🇬🇪" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
  ];

  const addedLocales = localizations.map((loc) => loc.locale);
  const availableToAdd = availableLocales.filter(
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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-3xl">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  თარგმანები
                </h3>
              </div>
              {availableToAdd.length > 0 && (
                <div className="relative group">
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    + ენის დამატება
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10">
                    {availableToAdd.map((locale) => (
                      <button
                        key={locale.code}
                        type="button"
                        onClick={() => addLocalization(locale.code)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                      >
                        <span>{locale.flag}</span>
                        <span>{locale.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {localizations.map((loc) => {
              const localeInfo = availableLocales.find(
                (l) => l.code === loc.locale
              );
              return (
                <div
                  key={loc.locale}
                  className="border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{localeInfo?.flag}</span>
                      <span className="font-medium text-gray-700">
                        {localeInfo?.label}
                      </span>
                      {loc.locale === "ka" && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                          სავალდებულო
                        </span>
                      )}
                    </div>
                    {loc.locale !== "ka" && (
                      <button
                        type="button"
                        onClick={() => removeLocalization(loc.locale)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      სახელი{" "}
                      {loc.locale === "ka" && (
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
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder={`პროდუქტის სახელი ${localeInfo?.label}-ად`}
                      required={loc.locale === "ka"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      აღწერა
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
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
                      placeholder={`პროდუქტის აღწერა ${localeInfo?.label}-ად`}
                    />
                  </div>
                </div>
              );
            })}
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
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
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
                <div className="relative inline-block w-full sm:w-auto">
                  <div className="relative w-full sm:w-48 h-48 rounded-lg overflow-hidden border bg-gray-100">
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
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
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
              <label className="flex flex-col items-center justify-center w-full h-40 sm:h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mb-2" />
                <span className="text-xs sm:text-sm text-gray-500">
                  ატვირთეთ სურათი (არასავალდებულო)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
            <p className="text-xs text-gray-500 mt-2">
              მაქსიმალური ზომა: 5MB. PNG, JPG ან WebP
            </p>
          </div>

          {/* Show on Website Toggle */}
          <div className="flex items-start sm:items-center gap-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <input
              type="checkbox"
              id="showOnWebsite"
              checked={showOnWebsite}
              onChange={(e) => setShowOnWebsite(e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 sm:mt-0 flex-shrink-0"
            />
            <label
              htmlFor="showOnWebsite"
              className="flex items-start sm:items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 cursor-pointer"
            >
              <Globe
                size={16}
                className="sm:w-[18px] sm:h-[18px] text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0"
              />
              <span>გამოჩნდეს ვებსაიტზე (საჯარო პროდუქტი)</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 -mt-4 ml-1">
            თუ გამორთულია, პროდუქტი ხელმისაწვდომი იქნება მხოლოდ პირდაპირი ლინკით
          </p>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
            <button
              type="submit"
              disabled={updateLink.isPending}
              className="flex-1 bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
            >
              {updateLink.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>მიმდინარეობს განახლება...</span>
                </>
              ) : (
                <span>ლინკის განახლება</span>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={updateLink.isPending}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 sm:py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 font-medium text-sm sm:text-base"
            >
              გაუქმება
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
