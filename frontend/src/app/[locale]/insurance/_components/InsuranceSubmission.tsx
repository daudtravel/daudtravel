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
} from "lucide-react";
import { format, startOfDay, addDays } from "date-fns";
import { ka } from "date-fns/locale";

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

const MIN_DAYS = 5;

export default function InsuranceSubmissionPage() {
  const { data: settingsData, isLoading: settingsLoading } =
    useInsuranceSettings();
  const submitInsurance = useSubmitInsurance();
  const t = useTranslations("insurance");

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

  const calculateDays = (
    startDate: Date | undefined,
    endDate: Date | undefined
  ): number => {
    if (!startDate || !endDate) return 0;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days + 1;
  };

  const getDiscount = (days: number): number => {
    if (days >= 90 && discount90Days > 0) return discount90Days;
    if (days >= 30 && discount30Days > 0) return discount30Days;
    return 0;
  };

  const calculatePersonPrice = (
    startDate: Date | undefined,
    endDate: Date | undefined
  ) => {
    const days = calculateDays(startDate, endDate);
    if (days === 0)
      return { days: 0, baseAmount: 0, discount: 0, finalAmount: 0 };

    let baseAmount: number;
    if (days <= 7) {
      baseAmount = 40;
    } else {
      const additionalDays = days - 7;
      baseAmount = 40 + additionalDays * 5;
    }

    const discountPercent = getDiscount(days);
    const discountAmount = (baseAmount * discountPercent) / 100;
    const finalAmount = baseAmount - discountAmount;

    return { days, baseAmount, discount: discountPercent, finalAmount };
  };

  const peoplePricing = useMemo(() => {
    return people.map((p) => calculatePersonPrice(p.startDate, p.endDate));
  }, [people, settings]);

  const totalPrice = peoplePricing.reduce((sum, p) => sum + p.finalAmount, 0);

  const addPerson = () => {
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
  };

  const removePerson = (id: string) => {
    if (people.length === 1) {
      alert(t("minOnePerson"));
      return;
    }
    setPeople(people.filter((p) => p.id !== id));
  };

  const updatePerson = (id: string, field: string, value: any) => {
    setPeople((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };

        if (field === "startDate" && value && updated.endDate) {
          const days = calculateDays(value, updated.endDate);
          if (days < MIN_DAYS) {
            updated.endDate = undefined;
          }
        }
        return updated;
      })
    );
  };

  const handleImageUpload = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(t("pleaseSelectImage"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(t("imageTooLarge"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPeople((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, passportPhoto: base64, passportPreview: base64 }
            : p
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (id: string) => {
    setPeople((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, passportPhoto: null, passportPreview: null } : p
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!submitterEmail) {
      alert(t("pleaseEnterEmail"));
      return;
    }

    const invalidPerson = people.find(
      (p) =>
        !p.fullName ||
        !p.phoneNumber ||
        !p.passportPhoto ||
        !p.startDate ||
        !p.endDate
    );

    if (invalidPerson) {
      alert(t("fillAllFields"));
      return;
    }

    const invalidDates = people.find((p) => {
      if (!p.startDate || !p.endDate) return false;
      return p.startDate >= p.endDate;
    });

    if (invalidDates) {
      alert(t("startBeforeEnd"));
      return;
    }

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

      if (result.data.paymentUrl) {
        window.location.href = result.data.paymentUrl;
      }
    } catch (error: any) {
      console.error("Error submitting:", error);
      alert(error.response?.data?.message || t("submissionError"));
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (!settings?.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {t("serviceUnavailable")}
          </h2>
          <p className="text-gray-500 text-sm">{t("tryLaterOrContact")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-xl shrink-0">
            <Shield className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              {t("title")}
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm">{t("subtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="text-sm font-semibold text-gray-800">
                  {t("pricingTitle")}
                </span>
              </div>
              <ul className="space-y-1 text-sm text-gray-600 mb-3">
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">•</span>
                  {t("pricingLine1")}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">•</span>
                  {t("pricingLine2")}
                </li>
                <li className="flex items-start gap-2 text-gray-400 italic">
                  <span className="mt-0.5">→</span>
                  {t("pricingExample")}
                </li>
              </ul>
              {(discount30Days > 0 || discount90Days > 0) && (
                <div className="flex flex-wrap gap-2">
                  {discount30Days > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                      30+ {t("daysPlus")}: -{discount30Days}%
                    </span>
                  )}
                  {discount90Days > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                      90+ {t("daysPlus")}: -{discount90Days}%
                    </span>
                  )}
                </div>
              )}

              <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">{t("commissionNote")}</p>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-4 text-white">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-orange-100 text-xs mb-0.5">
                      {t("people")}
                    </p>
                    <p className="text-2xl font-bold">{people.length}</p>
                  </div>
                  <div>
                    <p className="text-orange-100 text-xs mb-0.5">
                      {t("totalDays")}
                    </p>
                    <p className="text-2xl font-bold">
                      {peoplePricing.reduce((s, p) => s + p.days, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-orange-100 text-xs mb-0.5">
                      {t("total")}
                    </p>
                    <p className="text-2xl font-bold">
                      ₾{totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4 flex-1">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                  <Mail className="w-3.5 h-3.5 text-orange-500" />
                  {t("yourEmail")}{" "}
                  <span className="text-orange-500">{t("required")}</span>
                </label>
                <input
                  type="email"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={t("emailPlaceholder")}
                  required
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  {t("emailHelper")}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                {t("insuredPersons")}
              </h2>
              <button
                type="button"
                onClick={addPerson}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus size={13} />
                {t("addPerson")}
              </button>
            </div>

            {people.map((person, index) => (
              <div
                key={person.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    {t("personNumber")}
                    {index + 1}
                    {peoplePricing[index]?.days > 0 && (
                      <span className="ml-2 text-xs font-normal text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                        {peoplePricing[index].days} {t("days")}
                        {peoplePricing[index].discount > 0 &&
                          ` · -${peoplePricing[index].discount}%`}
                        {" · "}₾{peoplePricing[index].finalAmount.toFixed(2)}
                      </span>
                    )}
                  </span>
                  {people.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePerson(person.id)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
                      <User className="w-3 h-3" />
                      {t("fullName")}{" "}
                      <span className="text-orange-500">{t("required")}</span>
                    </label>
                    <input
                      type="text"
                      value={person.fullName}
                      onChange={(e) =>
                        updatePerson(person.id, "fullName", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={t("fullNamePlaceholder")}
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
                      <Phone className="w-3 h-3" />
                      {t("phoneNumber")}{" "}
                      <span className="text-orange-500">{t("required")}</span>
                    </label>
                    <input
                      type="tel"
                      value={person.phoneNumber}
                      onChange={(e) =>
                        updatePerson(person.id, "phoneNumber", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={t("phonePlaceholder")}
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
                      <CalendarIcon className="w-3 h-3" />
                      {t("startDate")}{" "}
                      <span className="text-orange-500">{t("required")}</span>
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal text-sm h-8 px-2.5 bg-transparent",
                            !person.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                          {person.startDate ? (
                            format(person.startDate, "dd MMM yyyy", {
                              locale: ka,
                            })
                          ) : (
                            <span>{t("selectDate")}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={person.startDate}
                          onSelect={(date) =>
                            updatePerson(person.id, "startDate", date)
                          }
                          disabled={(date) => startOfDay(date) < today}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
                      <CalendarIcon className="w-3 h-3" />
                      {t("endDate")}{" "}
                      <span className="text-orange-500">{t("required")}</span>
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal text-sm h-8 px-2.5 bg-transparent",
                            !person.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                          {person.endDate ? (
                            format(person.endDate, "dd MMM yyyy", {
                              locale: ka,
                            })
                          ) : (
                            <span>{t("selectDate")}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={person.endDate}
                          onSelect={(date) =>
                            updatePerson(person.id, "endDate", date)
                          }
                          disabled={(date) => {
                            const d = startOfDay(date);

                            if (d < today) return true;
                            if (!person.startDate) return true;

                            const minEndDate = startOfDay(
                              addDays(person.startDate, MIN_DAYS - 1)
                            );
                            return d < minEndDate;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1.5">
                    <ImageIcon className="w-3 h-3" />
                    {t("passportPhoto")}{" "}
                    <span className="text-orange-500">{t("required")}</span>
                  </label>

                  {person.passportPreview ? (
                    <div className="relative inline-flex items-center gap-3">
                      <img
                        src={person.passportPreview}
                        alt={t("passportPhoto")}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(person.id)}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-3 w-full sm:w-auto px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-600">
                          {t("uploadPassport")}
                        </p>
                        <p className="text-xs text-gray-400">{t("maxSize")}</p>
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
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <button
              type="submit"
              disabled={submitInsurance.isPending}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-semibold text-sm"
            >
              {submitInsurance.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  {t("processing")}
                </>
              ) : (
                <>
                  <Shield size={16} />
                  {t("proceedToPayment")} — ₾{totalPrice.toFixed(2)}
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              {t("paymentNote")} {t("documentsNote")}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
