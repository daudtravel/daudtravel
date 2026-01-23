"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  CreditCard,
  Loader2,
  User,
  Mail,
  Plus,
  Minus,
  ShieldCheck,
  Package,
  Info,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";

interface ProductData {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  locale: string;
  availableLocales: string[];
}

interface Props {
  product: ProductData;
  locale: string;
  slug: string;
}

export const QuickPaymentPage: React.FC<Props> = ({
  product,
  locale,
  slug,
}) => {
  const t = useTranslations("payment");
  const [paying, setPaying] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalPrice = product.price * quantity;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = t("fullNameRequired");
    if (!formData.email.trim()) {
      newErrors.email = t("emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("emailRequired");
    }
    if (formData.phone.trim() && !/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = t("phoneInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;

    setPaying(true);

    try {
      const payload = {
        customerFullName: formData.name.trim(),
        customerEmail: formData.email.trim(),
        ...(formData.phone.trim() && { customerPhone: formData.phone.trim() }),
        locale: locale || "ka",
        quantity,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/quick-payment/links/${slug}/pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Payment failed");

      const result = await res.json();
      if (result.success && result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        throw new Error("No payment URL");
      }
    } catch (err) {
      alert(t("paymentError"));
      setPaying(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30 py-6 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-orange-100/50">
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-4">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-white" />
              <h1 className="text-lg font-bold text-white">{t("pageTitle")}</h1>
            </div>
          </div>

          <div className="p-5">
            <div className="mb-5">
              {product.image && (
                <div className="relative mb-4 overflow-hidden rounded-lg">
                  <img
                    src={`${process.env.NEXT_PUBLIC_BASE_URL}${product.image}`}
                    alt={product.name}
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              <div className="flex items-start gap-2 mb-4">
                <div className="p-1.5 bg-orange-100 rounded-lg mt-0.5">
                  <Package className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900 mb-0.5">
                    {product.name}
                  </h2>
                  {product.description && (
                    <p className="text-sm text-gray-600">
                      {product.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{t("unitPrice")}:</span>
                  <span className="font-bold text-gray-900">
                    ₾{product.price.toFixed(2)}
                  </span>
                </div>

                <div>
                  <Label className="text-sm mb-1.5">{t("quantity")}</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || paying}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(
                          Math.max(1, Math.min(100, +e.target.value || 1))
                        )
                      }
                      className="h-8 text-center font-semibold"
                      disabled={paying}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                      disabled={quantity >= 100 || paying}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">
                    {t("totalAmount")}:
                  </span>
                  <span className="text-xl font-bold text-orange-600">
                    ₾{totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-px flex-1 bg-gray-200"></div>
                <h3 className="font-semibold text-gray-900 text-xs uppercase">
                  {t("contactInfo")}
                </h3>
                <div className="h-px flex-1 bg-gray-200"></div>
              </div>

              <div>
                <Label htmlFor="name" className="text-sm">
                  {t("fullName")} <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder={t("fullNamePlaceholder")}
                    className={`pl-9 ${errors.name ? "border-red-500" : ""}`}
                    disabled={paying}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-sm">
                  {t("email")} <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className={`pl-9 ${errors.email ? "border-red-500" : ""}`}
                    disabled={paying}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm">
                  {t("phone")}{" "}
                  <span className="text-gray-400 text-xs">
                    ({t("optional")})
                  </span>
                </Label>
                <div className="mt-1.5">
                  <PhoneInput
                    international
                    defaultCountry="GE"
                    value={formData.phone}
                    onChange={(value) => updateField("phone", value || "")}
                    disabled={paying}
                    className={`flex h-10 w-full rounded-md border ${
                      errors.phone ? "border-red-500" : "border-input"
                    } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                )}
              </div>

              <Button
                onClick={handlePay}
                disabled={paying}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 h-11 mt-2"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>{t("processing")}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    <span>
                      {t("pay", { amount: `₾${totalPrice.toFixed(2)}` })}
                    </span>
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 mt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                <p className="text-xs text-gray-600">{t("securePayment")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800 leading-relaxed">
              {t("returnNotice")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
