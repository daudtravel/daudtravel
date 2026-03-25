"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { motion } from "framer-motion";
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
  Globe,
  Phone,
} from "lucide-react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import Image from "next/image";
import Link from "next/link";

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

const LOCALE_LABELS: Record<string, { label: string; flag: string }> = {
  ka: { label: "ქართული", flag: "🇬🇪" },
  en: { label: "English", flag: "🇬🇧" },
  ru: { label: "Русский", flag: "🇷🇺" },
  tr: { label: "Türkçe", flag: "🇹🇷" },
  ar: { label: "العربية", flag: "🇸🇦" },
};

const inputClass = (error?: string) =>
  `pl-10 h-11 rounded-xl border bg-white text-sm transition-colors duration-150 outline-none focus-visible:ring-0 ${
    error
      ? "border-red-400 focus-visible:border-red-400"
      : "border-gray-200 focus-visible:border-main"
  }`;

interface LanguageSwitcherProps {
  availableLocales: string[];
  locale: string;
  slug: string;
  dark?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  availableLocales,
  locale,
  slug,
  dark = false,
}) => {
  if (!availableLocales || availableLocales.length <= 1) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Globe size={13} className={dark ? "text-white/40" : "text-gray-400"} />
      {availableLocales.map((loc) => {
        const info = LOCALE_LABELS[loc];
        const isActive = loc === locale;
        return (
          <Link
            key={loc}
            href={`/${loc}/pay/${slug}`}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              isActive
                ? dark
                  ? "bg-white/20 text-white border border-white/30"
                  : "bg-main text-white"
                : dark
                  ? "bg-white/10 text-white/60 border border-white/10 hover:bg-white/20"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            <span>{info?.flag}</span>
            <span>{info?.label ?? loc.toUpperCase()}</span>
          </Link>
        );
      })}
    </div>
  );
};

interface FormContentProps {
  t: ReturnType<typeof useTranslations>;
  product: ProductData;
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  formData: { name: string; email: string; phone: string };
  errors: Record<string, string>;
  paying: boolean;
  totalPrice: number;
  updateField: (field: "name" | "email" | "phone", value: string) => void;
  handlePay: () => void;
}

const FormContent: React.FC<FormContentProps> = ({
  t,
  product,
  quantity,
  setQuantity,
  formData,
  errors,
  paying,
  totalPrice,
  updateField,
  handlePay,
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">
          {t("unitPrice")}
        </p>
        <p className="text-2xl font-bold text-[#1a1a1a]">
          ₾{product.price.toFixed(2)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={quantity <= 1 || paying}
          className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors hover:border-main hover:text-main"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-8 text-center text-lg font-bold text-[#1a1a1a]">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(100, q + 1))}
          disabled={quantity >= 100 || paying}
          className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors hover:border-main hover:text-main"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
        {t("contactInfo")}
      </span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>

    <div>
      <Label
        htmlFor="name"
        className="text-[10px] font-medium text-gray-400 uppercase tracking-widest"
      >
        {t("fullName")} <span className="text-red-400">*</span>
      </Label>
      <div className="relative mt-1.5">
        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder={t("fullNamePlaceholder")}
          className={inputClass(errors.name)}
          disabled={paying}
        />
      </div>
      {errors.name && (
        <p className="mt-1 text-xs text-red-500">{errors.name}</p>
      )}
    </div>

    <div>
      <Label
        htmlFor="email"
        className="text-[10px] font-medium text-gray-400 uppercase tracking-widest"
      >
        {t("email")} <span className="text-red-400">*</span>
      </Label>
      <div className="relative mt-1.5">
        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder={t("emailPlaceholder")}
          className={inputClass(errors.email)}
          disabled={paying}
        />
      </div>
      {errors.email && (
        <p className="mt-1 text-xs text-red-500">{errors.email}</p>
      )}
    </div>

    <div>
      <Label
        htmlFor="phone"
        className="text-[10px] font-medium text-gray-400 uppercase tracking-widest"
      >
        {t("phone")}{" "}
        <span className="text-gray-300 text-[10px] normal-case tracking-normal">
          ({t("optional")})
        </span>
      </Label>
      <div className="relative mt-1.5">
        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 z-10 pointer-events-none" />
        <PhoneInput
          international
          defaultCountry="GE"
          value={formData.phone}
          onChange={(value) => updateField("phone", value || "")}
          disabled={paying}
          className={`phone-input-custom flex h-11 w-full rounded-xl border ${
            errors.phone ? "border-red-400" : "border-gray-200"
          } bg-white px-3 text-sm transition-colors duration-150`}
        />
      </div>
      {errors.phone && (
        <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
      )}
    </div>

    <div className="pt-2 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{t("totalAmount")}</span>
        <span className="text-3xl font-bold text-[#1a1a1a]">
          ₾{totalPrice.toFixed(2)}
        </span>
      </div>

      <button
        onClick={handlePay}
        disabled={paying}
        className="w-full flex items-center justify-center gap-2.5 bg-main text-white rounded-2xl text-base font-semibold active:scale-[0.98] disabled:opacity-60 transition-all duration-200 shadow-lg shadow-black/10 py-4"
      >
        {paying ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t("processing")}</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>{t("pay", { amount: `₾${totalPrice.toFixed(2)}` })}</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <p className="text-xs text-gray-400">{t("securePayment")}</p>
      </div>
    </div>

    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex items-start gap-2.5">
      <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
      <p className="text-xs text-blue-700 leading-relaxed">
        {t("returnNotice")}
      </p>
    </div>
  </div>
);

export const QuickPaymentPage: React.FC<Props> = ({
  product,
  locale,
  slug,
}) => {
  const t = useTranslations("payment");
  const [paying, setPaying] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalPrice = product.price * quantity;
  const imageUrl = product.image
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${product.image}`
    : null;

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
    } catch {
      alert(t("paymentError"));
      setPaying(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const formProps: FormContentProps = {
    t,
    product,
    quantity,
    setQuantity,
    formData,
    errors,
    paying,
    totalPrice,
    updateField,
    handlePay,
  };

  return (
    <>
      <style>{`
        .phone-input-custom .PhoneInputCountry { margin-left: 2rem; }
        .phone-input-custom .PhoneInputInput { background: transparent; outline: none; font-size: 0.875rem; width: 100%; }
        .phone-input-custom:focus-within { border-color: var(--color-main) !important; }
      `}</style>

      <div className="hidden md:flex min-h-screen bg-[#f8f6f1]">
        <motion.div
          className="relative w-[52%] lg:w-[55%] bg-[#1a1a1a] overflow-hidden"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover opacity-80"
                priority
                sizes="(min-width: 1024px) 55vw, 52vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/15" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-24 h-24 text-white/10" />
            </div>
          )}

          <div className="absolute top-8 left-10 right-10 flex items-center justify-between">
            <span className="text-white/40 text-xs font-medium tracking-widest uppercase">
              Daud Travel
            </span>
            <LanguageSwitcher
              availableLocales={product.availableLocales}
              locale={locale}
              slug={slug}
              dark
            />
          </div>

          <motion.div
            className="absolute bottom-10 left-10 right-10"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
          >
            <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-3">
              {product.name}
            </h1>
            {product.description && (
              <p className="text-white/55 text-sm leading-relaxed line-clamp-3 mb-6 max-w-sm">
                {product.description}
              </p>
            )}
            <div className="inline-flex items-baseline gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3.5">
              <span className="text-white/60 text-base">₾</span>
              <span className="text-white text-4xl font-bold tracking-tight">
                {product.price % 1 === 0
                  ? product.price.toFixed(0)
                  : product.price.toFixed(2)}
              </span>
              <span className="text-white/40 text-sm ml-1">
                {t("unitPrice").toLowerCase()}
              </span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="w-[48%] lg:w-[45%] flex flex-col justify-center px-8 lg:px-12 xl:px-16 py-12 overflow-y-auto"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-8">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-gray-400 uppercase tracking-widest">
                {t("pageTitle")}
              </span>
            </div>
            <FormContent {...formProps} />
          </motion.div>
        </motion.div>
      </div>

      <div className="md:hidden min-h-screen bg-[#f8f6f1]">
        <div className="relative w-full h-64 bg-[#1a1a1a] overflow-hidden">
          {imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover opacity-80"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-white/10" />
            </div>
          )}

          <div className="absolute top-5 left-5">
            <span className="text-white/40 text-xs font-medium tracking-widest uppercase">
              Daud Travel
            </span>
          </div>

          <div className="absolute bottom-5 left-5 right-5">
            <h1 className="text-xl font-bold text-white mb-2">
              {product.name}
            </h1>
            <div className="inline-flex items-baseline gap-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2">
              <span className="text-white/60 text-sm">₾</span>
              <span className="text-white text-2xl font-bold">
                {product.price % 1 === 0
                  ? product.price.toFixed(0)
                  : product.price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="px-5 py-7">
          <div className="mb-5">
            <LanguageSwitcher
              availableLocales={product.availableLocales}
              locale={locale}
              slug={slug}
            />
          </div>
          {product.description && (
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              {product.description}
            </p>
          )}
          <FormContent {...formProps} />
        </div>
      </div>
    </>
  );
};
