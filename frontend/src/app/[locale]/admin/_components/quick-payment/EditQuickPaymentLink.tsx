"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Upload, X, ArrowLeft, Globe } from "lucide-react";
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

export const EditQuickLink = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("quickPayment");

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    showOnWebsite: false, // ✅ NEW
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);

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

      setFormData({
        name: link.name,
        description: link.description || "",
        price: link.price.toString(),
        image: "",
        showOnWebsite: link.showOnWebsite || false, // ✅ NEW
      });

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
      setFormData((prev) => ({ ...prev, image: base64String }));
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }));
    setImagePreview(existingImage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price) {
      alert("გთხოვთ შეავსოთ ყველა სავალდებულო ველი");
      return;
    }

    const priceValue = parseFloat(formData.price);
    if (isNaN(priceValue) || priceValue <= 0) {
      alert("გთხოვთ შეიყვანოთ სწორი ფასი");
      return;
    }

    try {
      const submitData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: priceValue,
        showOnWebsite: formData.showOnWebsite, // ✅ NEW
      };

      // Only include image if a new one was uploaded
      if (formData.image) {
        submitData.image = formData.image;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            ლინკის რედაქტირება
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              პროდუქტის დასახელება <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="მაგ: პრემიუმ პაკეტი"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              აღწერა
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="პროდუქტის დეტალური აღწერა..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ფასი (₾) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              სურათი
            </label>

            {imagePreview ? (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <div className="relative w-48 h-48 rounded-lg overflow-hidden border bg-gray-100">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized={imagePreview.startsWith("data:") || false}
                    />
                  </div>
                  {formData.image && (
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
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <Upload size={16} />
                    <span className="text-sm">სურათის შეცვლა</span>
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
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">
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

          {/* ✅ NEW: Show on Website Toggle */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <input
              type="checkbox"
              id="showOnWebsite"
              checked={formData.showOnWebsite}
              onChange={(e) =>
                setFormData({ ...formData, showOnWebsite: e.target.checked })
              }
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="showOnWebsite"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"
            >
              <Globe size={18} className="text-blue-600" />
              <span>გამოჩნდეს ვებსაიტზე (საჯარო პროდუქტი)</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 -mt-4 ml-1">
            თუ გამორთულია, პროდუქტი ხელმისაწვდომი იქნება მხოლოდ პირდაპირი ლინკით
          </p>

          <div className="flex gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={updateLink.isPending}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
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
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 font-medium"
            >
              გაუქმება
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
