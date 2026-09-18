"use client";

import React, { useState } from "react";
import { X, Loader2, Upload, XCircle, Globe } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useCreateQuickLink } from "@/src/hooks/quick-payment/useQuickPayment";

export const CreateQuickLink = () => {
  const router = useRouter();
  const pathname = usePathname();
  const createLink = useCreateQuickLink();
  const t = useTranslations("admin");

  // Georgian localization (default/required)
  const [formData, setFormData] = useState({
    nameKa: "",
    descriptionKa: "",
    price: "",
    showOnWebsite: false,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("quickLinks.selectImage"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("quickLinks.imageTooLarge10"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImageBase64(base64);
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageBase64(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ FIXED: Better validation
    if (!formData.nameKa || !formData.nameKa.trim()) {
      toast.error(t("quickLinks.productNameRequired"));
      return;
    }

    const priceValue = parseFloat(formData.price);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error(t("common.enterValidPrice"));
      return;
    }

    try {
      const submitData = {
        localizations: [
          {
            locale: "ka",
            name: formData.nameKa.trim(),
            // ✅ FIXED: Send undefined instead of empty string
            description: formData.descriptionKa.trim() || undefined,
          },
        ],
        image: imageBase64 || undefined,
        price: priceValue,
        showOnWebsite: formData.showOnWebsite,
      };

      await createLink.mutateAsync(submitData);

      // Reset form
      setFormData({
        nameKa: "",
        descriptionKa: "",
        price: "",
        showOnWebsite: false,
      });
      setImagePreview(null);
      setImageBase64(null);

      toast.success(t("quickLinks.created"));
      router.push(`${pathname}?quickPayment=all`);
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (error instanceof Error ? error.message : t("quickLinks.createError"));
      toast.error(errorMessage);
    }
  };

  const handleBack = () => {
    router.push(`${pathname}?quickPayment=all`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mx-2 sm:mx-0">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
          {t("quickLinks.createTitle")}
        </h2>
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} className="sm:w-6 sm:h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        {/* Georgian Name - Required */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("quickLinks.productNameKa")}
          </label>
          <input
            type="text"
            value={formData.nameKa}
            onChange={(e) =>
              setFormData({ ...formData, nameKa: e.target.value })
            }
            placeholder={t("quickLinks.productNamePlaceholder")}
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {t("quickLinks.georgianRequiredHint")}
          </p>
        </div>

        {/* Georgian Description - Optional */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("quickLinks.descriptionKa")}
          </label>
          <textarea
            value={formData.descriptionKa}
            onChange={(e) =>
              setFormData({ ...formData, descriptionKa: e.target.value })
            }
            placeholder={t("quickLinks.descriptionKaPlaceholder")}
            rows={3}
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base resize-none"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("quickLinks.imageOptional")}
          </label>
          {imagePreview ? (
            <div className="relative w-full h-40 sm:h-48 border rounded-lg overflow-hidden">
              <img
                src={imagePreview}
                alt={t("common.preview")}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1.5 sm:p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <XCircle size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-40 sm:h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
              <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mb-2" />
              <p className="text-xs sm:text-sm text-gray-500">
                {t("quickLinks.dropImage")}
              </p>
              <p className="text-xs text-gray-400 mt-1">{t("quickLinks.max10")}</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("common.priceGel")} *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            placeholder={t("quickLinks.pricePlaceholder")}
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            required
          />
        </div>

        {/* Show on Website Toggle */}
        <div className="flex items-start sm:items-center gap-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <input
            type="checkbox"
            id="showOnWebsite"
            checked={formData.showOnWebsite}
            onChange={(e) =>
              setFormData({ ...formData, showOnWebsite: e.target.checked })
            }
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
            <span>{t("quickLinks.showOnWebsite")}</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 -mt-2 ml-1">
          {t("quickLinks.showOnWebsiteHint")}
        </p>

        {/* Info Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-yellow-800">
            💡{" "}
            {t.rich("quickLinks.infoBox", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={createLink.isPending}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
          >
            {createLink.isPending && (
              <Loader2 className="animate-spin" size={20} />
            )}
            {t("common.create")}
          </button>
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
};
