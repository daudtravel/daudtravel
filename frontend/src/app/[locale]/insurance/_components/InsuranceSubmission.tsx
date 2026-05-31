"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Upload,
  X,
  Loader2,
  Shield,
  Users,
  Mail,
  User,
  Phone,
  ImageIcon,
  CalendarIcon,
  Info,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { format, startOfDay, addDays } from "date-fns";
import { ka, enUS, ar, tr, ru } from "date-fns/locale";
import { useLocale } from "next-intl";
import { compressImage } from "@/src/utlis/image-compressor";

import {
  useInsuranceSettings,
  useSubmitInsurance,
} from "@/src/hooks/insurance/useInsurance";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/utlis/cn";
import { Calendar } from "@/src/components/ui/calendar";
import { useTranslations } from "next-intl";

interface PersonForm {
  id: string;
  fullName: string;
  phoneNumber: string;
  passportPhoto: string | null;
  passportPreview: string | null;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

type PersonFormField = keyof Omit<PersonForm, "id">;

const localeMap = { ka, en: enUS, ar, tr, ru } as const;

const MIN_DAYS = 5;

// How many required fields a person has total (fullName, phoneNumber, startDate, endDate, passportPhoto)
function getPersonCompletionCount(p: PersonForm): number {
  return [p.fullName, p.phoneNumber, p.startDate, p.endDate, p.passportPhoto].filter(
    Boolean
  ).length;
}

export default function InsuranceSubmissionPage() {
  const { data: settingsData, isLoading: settingsLoading } = useInsuranceSettings();
  const submitInsurance = useSubmitInsurance();
  const t = useTranslations("insurance");
  const currentLocale = useLocale() as keyof typeof localeMap;
  const dateLocale = localeMap[currentLocale] ?? enUS;

  const [submitterEmail, setSubmitterEmail] = useState("");
  const [people, setPeople] = useState<PersonForm[]>([
    {
      id: crypto.randomUUID(),
      fullName: "",
      phoneNumber: "",
      passportPhoto: null,
      passportPreview: null,
      startDate: undefined,
      endDate: undefined,
    },
  ]);

  const settings = settingsData?.data;
  const discount30Days = settings?.discount30Days ?? 0;
  const discount90Days = settings?.discount90Days ?? 0;
  const today = startOfDay(new Date());

  const calculateDays = (startDate: Date | undefined, endDate: Date | undefined): number => {
    if (!startDate || !endDate) return 0;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getDiscount = (days: number): number => {
    if (days >= 90 && discount90Days > 0) return discount90Days;
    if (days >= 30 && discount30Days > 0) return discount30Days;
    return 0;
  };

  const calculatePersonPrice = (startDate: Date | undefined, endDate: Date | undefined) => {
    const days = calculateDays(startDate, endDate);
    if (days === 0) return { days: 0, baseAmount: 0, discount: 0, finalAmount: 0 };
    const baseAmount = days <= 7 ? 40 : 40 + (days - 7) * 5;
    const discountPercent = getDiscount(days);
    const finalAmount = baseAmount - (baseAmount * discountPercent) / 100;
    return { days, baseAmount, discount: discountPercent, finalAmount };
  };

  const peoplePricing = useMemo(
    () => people.map((p) => calculatePersonPrice(p.startDate, p.endDate)),
    [people, settings]
  );

  const totalPrice = peoplePricing.reduce((sum, p) => sum + p.finalAmount, 0);
  const totalDays = peoplePricing.reduce((sum, p) => sum + p.days, 0);

  const addPerson = () =>
    setPeople([
      ...people,
      {
        id: crypto.randomUUID(),
        fullName: "",
        phoneNumber: "",
        passportPhoto: null,
        passportPreview: null,
        startDate: undefined,
        endDate: undefined,
      },
    ]);

  const removePerson = (id: string) => {
    if (people.length === 1) { alert(t("minOnePerson")); return; }
    setPeople(people.filter((p) => p.id !== id));
  };

  const updatePerson = (id: string, field: PersonFormField, value: PersonForm[PersonFormField]) => {
    setPeople((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };
        if (field === "startDate" && value instanceof Date && updated.endDate) {
          if (calculateDays(value, updated.endDate) < MIN_DAYS) updated.endDate = undefined;
        }
        return updated;
      })
    );
  };

  const handleImageUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert(t("pleaseSelectImage")); return; }
    if (file.size > 10 * 1024 * 1024) { alert(t("imageTooLarge")); return; }

    try {
      const base64 = await compressImage(file, { maxWidth: 1200, maxHeight: 1600, quality: 0.8, outputFormat: "image/jpeg" });
      setPeople((prev) => prev.map((p) => p.id === id ? { ...p, passportPhoto: base64, passportPreview: base64 } : p));
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setPeople((prev) => prev.map((p) => p.id === id ? { ...p, passportPhoto: base64, passportPreview: base64 } : p));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (id: string) =>
    setPeople((prev) => prev.map((p) => p.id === id ? { ...p, passportPhoto: null, passportPreview: null } : p));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitterEmail) { alert(t("pleaseEnterEmail")); return; }
    const invalidPerson = people.find((p) => !p.fullName || !p.phoneNumber || !p.passportPhoto || !p.startDate || !p.endDate);
    if (invalidPerson) { alert(t("fillAllFields")); return; }
    const invalidDates = people.find((p) => p.startDate && p.endDate && p.startDate >= p.endDate);
    if (invalidDates) { alert(t("startBeforeEnd")); return; }

    try {
      const result = await submitInsurance.mutateAsync({
        submitterEmail,
        people: people.map((p) => ({
          fullName: p.fullName,
          phoneNumber: p.phoneNumber,
          passportPhoto: p.passportPhoto!,
          startDate: format(p.startDate!, "yyyy-MM-dd"),
          endDate: format(p.endDate!, "yyyy-MM-dd"),
        })),
      });
      if (result.data.paymentUrl) window.location.href = result.data.paymentUrl;
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : t("submissionError"));
      alert(msg);
    }
  };

  // ─── Loading state ────────────────────────────────────────────────────────────
  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-green-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-brand-green mx-auto mb-3" size={36} />
          <p className="text-brand-green-mid text-sm font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  // ─── Service unavailable ──────────────────────────────────────────────────────
  if (!settings?.isActive) {
    return (
      <div className="min-h-screen bg-brand-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center border border-brand-green-100">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-brand-green" />
          </div>
          <h2 className="text-xl font-bold text-brand-green mb-2">{t("serviceUnavailable")}</h2>
          <p className="text-gray-500 text-sm">{t("tryLaterOrContact")}</p>
        </div>
      </div>
    );
  }

  // ─── Main form ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-brand-green-50">

      {/* Page Header */}
      <div className="bg-brand-green px-4 py-8 sm:py-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-white/15 rounded-xl shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {t("title")}
            </h1>
            <p className="text-brand-green-100 text-xs sm:text-sm mt-0.5">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <form onSubmit={handleSubmit} noValidate>

          {/* ── Top row: pricing info + summary widget ─────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">

            {/* Pricing Info Card */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-brand-green-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-brand-green-100 flex items-center justify-center shrink-0">
                  <Info className="w-3.5 h-3.5 text-brand-green" />
                </div>
                <span className="text-sm font-semibold text-brand-green">{t("pricingTitle")}</span>
              </div>

              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-2 shrink-0" />
                  {t("pricingLine1")}
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-2 shrink-0" />
                  {t("pricingLine2")}
                </li>
                <li className="flex items-start gap-2.5 text-gray-400 italic text-xs">
                  <span className="mt-1.5 shrink-0">→</span>
                  {t("pricingExample")}
                </li>
              </ul>

              {(discount30Days > 0 || discount90Days > 0) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {discount30Days > 0 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-green-100 text-brand-green text-xs rounded-full font-medium border border-brand-green-100">
                      30+ {t("daysPlus")}: <strong>-{discount30Days}%</strong>
                    </span>
                  )}
                  {discount90Days > 0 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-green-100 text-brand-green text-xs rounded-full font-medium border border-brand-green-100">
                      90+ {t("daysPlus")}: <strong>-{discount90Days}%</strong>
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-brand-green-50 rounded-lg border border-brand-green-100">
                <AlertCircle className="w-4 h-4 text-brand-green-mid shrink-0 mt-0.5" />
                <p className="text-xs text-brand-green-mid">{t("commissionNote")}</p>
              </div>
            </div>

            {/* Right column: summary + email */}
            <div className="lg:col-span-2 flex flex-col gap-4">

              {/* Summary Counter */}
              <div className="bg-brand-green rounded-xl p-5 text-white shadow-sm">
                <p className="text-brand-green-100 text-xs font-medium mb-3 uppercase tracking-wide">
                  {t("orderSummary") ?? "Order Summary"}
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white/10 rounded-lg py-2.5">
                    <p className="text-brand-green-100 text-xs mb-1">{t("people")}</p>
                    <p className="text-2xl font-bold">{people.length}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg py-2.5">
                    <p className="text-brand-green-100 text-xs mb-1">{t("totalDays")}</p>
                    <p className="text-2xl font-bold">{totalDays}</p>
                  </div>
                  <div className="bg-brand-yellow rounded-lg py-2.5">
                    <p className="text-brand-green text-xs mb-1 font-medium">{t("total")}</p>
                    <p className="text-2xl font-bold text-brand-green">₾{totalPrice.toFixed(0)}</p>
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className="bg-white rounded-xl border border-brand-green-100 p-5 flex-1 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-semibold text-brand-green mb-1" htmlFor="submitter-email">
                  <Mail className="w-4 h-4" />
                  {t("yourEmail")}
                  <span className="text-red-500 font-bold" aria-hidden="true">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">{t("emailHelper")}</p>
                <input
                  id="submitter-email"
                  type="email"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border-2 border-brand-green-100 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-colors outline-none"
                  placeholder={t("emailPlaceholder")}
                  required
                  aria-required="true"
                />
              </div>
            </div>
          </div>

          {/* ── Required fields legend ─────────────────────────────────── */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-red-500 font-bold text-sm" aria-hidden="true">*</span>
            <span className="text-xs text-gray-500">{t("requiredFieldsNote") ?? "Fields marked with * are required"}</span>
          </div>

          {/* ── Insured Persons ────────────────────────────────────────── */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-brand-green flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t("insuredPersons")}
              </h2>
              <button
                type="button"
                onClick={addPerson}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-brand-green text-white rounded-lg hover:bg-brand-green-dark transition-colors shadow-sm"
              >
                <Plus size={15} />
                {t("addPerson")}
              </button>
            </div>

            <div className="space-y-4">
              {people.map((person, index) => {
                const pricing = peoplePricing[index];
                const completedCount = getPersonCompletionCount(person);
                const isComplete = completedCount === 5;

                return (
                  <div
                    key={person.id}
                    className={cn(
                      "bg-white rounded-xl border-2 shadow-sm transition-colors",
                      isComplete ? "border-brand-green-100" : "border-gray-200"
                    )}
                  >
                    {/* Card Header */}
                    <div className={cn(
                      "flex items-center justify-between px-5 py-3.5 rounded-t-xl border-b",
                      isComplete ? "bg-brand-green-50 border-brand-green-100" : "bg-gray-50 border-gray-100"
                    )}>
                      <div className="flex items-center gap-3">
                        {/* Completion indicator */}
                        {isComplete ? (
                          <div className="w-7 h-7 rounded-full bg-brand-green flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-brand-green-100 border-2 border-brand-green-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-brand-green">{index + 1}</span>
                          </div>
                        )}

                        <div>
                          <span className="text-sm font-semibold text-gray-800">
                            {person.fullName || `${t("personNumber")}${index + 1}`}
                          </span>
                          {!isComplete && (
                            <span className="ml-2 text-xs text-gray-400">
                              {completedCount}/5 {t("fieldsCompleted") ?? "fields"}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {pricing.days > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-brand-green-mid bg-brand-green-100 px-2.5 py-1 rounded-full font-medium">
                              {pricing.days} {t("days")}
                            </span>
                            {pricing.discount > 0 && (
                              <span className="text-xs text-brand-green bg-brand-yellow/30 px-2 py-1 rounded-full font-semibold">
                                -{pricing.discount}%
                              </span>
                            )}
                            <span className="text-sm font-bold text-brand-green">
                              ₾{pricing.finalAmount.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {people.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePerson(person.id)}
                            aria-label={`Remove person ${index + 1}`}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5">
                      {/* Row 1: Name + Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                            <User className="w-3 h-3 text-brand-green" />
                            {t("fullName")}
                            <span className="text-red-500 font-bold" aria-hidden="true">*</span>
                          </label>
                          <input
                            type="text"
                            value={person.fullName}
                            onChange={(e) => updatePerson(person.id, "fullName", e.target.value)}
                            className={cn(
                              "w-full px-3 py-2.5 text-sm border-2 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-colors outline-none",
                              person.fullName ? "border-brand-green-100" : "border-gray-200"
                            )}
                            placeholder={t("fullNamePlaceholder")}
                            required
                            aria-required="true"
                          />
                        </div>

                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                            <Phone className="w-3 h-3 text-brand-green" />
                            {t("phoneNumber")}
                            <span className="text-red-500 font-bold" aria-hidden="true">*</span>
                          </label>
                          <input
                            type="tel"
                            value={person.phoneNumber}
                            onChange={(e) => updatePerson(person.id, "phoneNumber", e.target.value)}
                            className={cn(
                              "w-full px-3 py-2.5 text-sm border-2 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-colors outline-none",
                              person.phoneNumber ? "border-brand-green-100" : "border-gray-200"
                            )}
                            placeholder={t("phonePlaceholder")}
                            required
                            aria-required="true"
                          />
                        </div>
                      </div>

                      {/* Row 2: Dates */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                            <CalendarIcon className="w-3 h-3 text-brand-green" />
                            {t("startDate")}
                            <span className="text-red-500 font-bold" aria-hidden="true">*</span>
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal text-sm h-10 px-3 border-2 transition-colors",
                                  person.startDate
                                    ? "border-brand-green-100 text-gray-800"
                                    : "border-gray-200 text-gray-400"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 text-brand-green shrink-0" />
                                {person.startDate
                                  ? format(person.startDate, "dd MMM yyyy", { locale: dateLocale })
                                  : t("selectDate")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={person.startDate}
                                onSelect={(date) => updatePerson(person.id, "startDate", date)}
                                disabled={(date) => startOfDay(date) < today}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                            <CalendarIcon className="w-3 h-3 text-brand-green" />
                            {t("endDate")}
                            <span className="text-red-500 font-bold" aria-hidden="true">*</span>
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal text-sm h-10 px-3 border-2 transition-colors",
                                  person.endDate
                                    ? "border-brand-green-100 text-gray-800"
                                    : "border-gray-200 text-gray-400"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 text-brand-green shrink-0" />
                                {person.endDate
                                  ? format(person.endDate, "dd MMM yyyy", { locale: dateLocale })
                                  : t("selectDate")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={person.endDate}
                                onSelect={(date) => updatePerson(person.id, "endDate", date)}
                                disabled={(date) => {
                                  const d = startOfDay(date);
                                  if (d < today) return true;
                                  if (!person.startDate) return true;
                                  return d < startOfDay(addDays(person.startDate, MIN_DAYS - 1));
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          {person.startDate && !person.endDate && (
                            <p className="mt-1 text-xs text-brand-green-mid">
                              {t("minDaysNote") ?? `Minimum ${MIN_DAYS} days`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Row 3: Passport Photo */}
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                          <ImageIcon className="w-3 h-3 text-brand-green" />
                          {t("passportPhoto")}
                          <span className="text-red-500 font-bold" aria-hidden="true">*</span>
                        </label>

                        {person.passportPreview ? (
                          <div className="flex items-center gap-4 p-3 bg-brand-green-50 rounded-xl border border-brand-green-100">
                            <div className="relative shrink-0">
                              <img
                                src={person.passportPreview}
                                alt={t("passportPhoto")}
                                className="w-16 h-16 object-cover rounded-lg border-2 border-brand-green-100"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(person.id)}
                                aria-label="Remove photo"
                                className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-colors"
                              >
                                <X size={10} />
                              </button>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <CheckCircle2 className="w-4 h-4 text-brand-green" />
                                <span className="text-sm font-medium text-brand-green">
                                  {t("photoUploaded") ?? "Photo uploaded"}
                                </span>
                              </div>
                              <label className="text-xs text-brand-green-mid underline cursor-pointer hover:text-brand-green transition-colors">
                                {t("changePhoto") ?? "Change photo"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(person.id, e)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <label className={cn(
                            "flex items-center gap-4 w-full px-5 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                            "border-gray-200 hover:border-brand-green hover:bg-brand-green-50"
                          )}>
                            <div className="w-10 h-10 rounded-full bg-brand-green-100 flex items-center justify-center shrink-0">
                              <Upload className="w-5 h-5 text-brand-green" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-700">{t("uploadPassport")}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{t("maxSize")}</p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(person.id, e)}
                              className="hidden"
                              required
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add another person button — secondary position */}
            <button
              type="button"
              onClick={addPerson}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-brand-green-100 rounded-xl text-sm font-medium text-brand-green-mid hover:border-brand-green hover:text-brand-green hover:bg-brand-green-50 transition-colors"
            >
              <Plus size={16} />
              {t("addPerson")}
            </button>
          </div>

          {/* ── Submit ─────────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-brand-green-100 p-5 shadow-sm">
            {/* Price breakdown */}
            {totalPrice > 0 && (
              <div className="flex items-center justify-between py-3 mb-4 border-b border-brand-green-100">
                <div className="text-sm text-gray-600">
                  {people.length} {t("people")} · {totalDays} {t("totalDays")}
                </div>
                <div className="text-xl font-bold text-brand-green">₾{totalPrice.toFixed(2)}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitInsurance.isPending}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-green text-white rounded-xl hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-semibold text-sm"
            >
              {submitInsurance.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  {t("processing")}
                </>
              ) : (
                <>
                  <Shield size={16} />
                  {t("proceedToPayment")}
                  {totalPrice > 0 && <span className="ml-1 opacity-90">— ₾{totalPrice.toFixed(2)}</span>}
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3 leading-relaxed">
              {t("paymentNote")} {t("documentsNote")}
            </p>
          </div>

        </form>
      </div>
    </div>
  );
}
