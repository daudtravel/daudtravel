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
} from "lucide-react";
import { format } from "date-fns";
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
  const pricePerDay = settings?.pricePerDay || 0;
  const discount30Days = settings?.discount30Days || 0;
  const discount90Days = settings?.discount90Days || 0;

  // Calculate days and price for each person
  const calculateDays = (
    startDate: Date | undefined,
    endDate: Date | undefined
  ): number => {
    if (!startDate || !endDate) return 0;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

    const baseAmount = days * pricePerDay;
    const discountPercent = getDiscount(days);
    const discountAmount = (baseAmount * discountPercent) / 100;
    const finalAmount = baseAmount - discountAmount;

    return { days, baseAmount, discount: discountPercent, finalAmount };
  };

  const peoplePricing = useMemo(() => {
    return people.map((p) => calculatePersonPrice(p.startDate, p.endDate));
  }, [people, pricePerDay, discount30Days, discount90Days]);

  const totalDays = peoplePricing.reduce((sum, p) => sum + p.days, 0);
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
    setPeople(people.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
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
      setPeople(
        people.map((p) =>
          p.id === id
            ? { ...p, passportPhoto: base64, passportPreview: base64 }
            : p
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (id: string) => {
    setPeople(
      people.map((p) =>
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

    // Validate date ranges
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
          startDate: p.startDate!.toISOString(),
          endDate: p.endDate!.toISOString(),
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
          <h2 className="text-xl sm:text-3xl font-bold text-gray-800 mb-2">
            {t("serviceUnavailable")}
          </h2>
          <p className="text-gray-600 text-sm">{t("tryLaterOrContact")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 py-6 sm:py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
            <Shield className="w-6 h-6 text-orange-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t("title")}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">{t("subtitle")}</p>
        </div>

        {/* Price Info */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-md p-4 sm:p-5 mb-6 text-white">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-orange-100 text-xs mb-1">{t("pricePerDay")}</p>
              <p className="text-xl sm:text-2xl font-bold">₾{pricePerDay}</p>
            </div>
            <div>
              <p className="text-orange-100 text-xs mb-1">{t("people")}</p>
              <p className="text-xl sm:text-2xl font-bold">{people.length}</p>
            </div>
            <div>
              <p className="text-orange-100 text-xs mb-1">{t("totalDays")}</p>
              <p className="text-xl sm:text-2xl font-bold">{totalDays}</p>
            </div>
            <div>
              <p className="text-orange-100 text-xs mb-1">{t("total")}</p>
              <p className="text-2xl sm:text-3xl font-bold">
                ₾{totalPrice.toFixed(2)}
              </p>
            </div>
          </div>
          {(discount30Days > 0 || discount90Days > 0) && (
            <div className="mt-3 pt-3 border-t border-orange-400/50 text-center">
              <p className="text-orange-100 text-xs">
                {t("discounts")}:{" "}
                {discount30Days > 0 &&
                  `30+ ${t("daysPlus")}: ${discount30Days}%`}
                {discount30Days > 0 && discount90Days > 0 && " | "}
                {discount90Days > 0 &&
                  `90+ ${t("daysPlus")}: ${discount90Days}%`}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Submitter Email */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
            <label className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-2">
              <Mail className="w-4 h-4 text-orange-600" />
              {t("yourEmail")}
            </label>
            <input
              type="email"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder={t("emailPlaceholder")}
              required
            />
            <p className="text-xs text-gray-500 mt-2">{t("emailHelper")}</p>
          </div>

          {/* People Forms */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                {t("insuredPersons")}
              </h2>
              <button
                type="button"
                onClick={addPerson}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-sm"
              >
                <Plus size={16} />
                {t("addPerson")}
              </button>
            </div>

            {people.map((person, index) => (
              <div
                key={person.id}
                className="bg-white rounded-xl shadow-sm p-4 sm:p-5 relative border border-gray-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-800">
                    {t("personNumber")}
                    {index + 1}
                  </h3>
                  {people.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePerson(person.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                      <User className="w-3.5 h-3.5" />
                      {t("fullName")} {t("required")}
                    </label>
                    <input
                      type="text"
                      value={person.fullName}
                      onChange={(e) =>
                        updatePerson(person.id, "fullName", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={t("fullNamePlaceholder")}
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {t("phoneNumber")} {t("required")}
                    </label>
                    <input
                      type="tel"
                      value={person.phoneNumber}
                      onChange={(e) =>
                        updatePerson(person.id, "phoneNumber", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={t("phonePlaceholder")}
                      required
                    />
                  </div>
                </div>

                {/* Date Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {t("startDate")} {t("required")}
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-transparent",
                            !person.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
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
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {t("endDate")} {t("required")}
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-transparent",
                            !person.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
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
                          disabled={(date) =>
                            date < new Date() ||
                            (person.startDate
                              ? date <= person.startDate
                              : false)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Person Price Summary */}
                {peoplePricing[index]?.days > 0 && (
                  <div className="mb-3 p-2 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex flex-wrap items-center justify-between text-xs text-orange-900">
                      <span>
                        {peoplePricing[index].days} {t("days")} × ₾{pricePerDay}
                      </span>
                      {peoplePricing[index].discount > 0 && (
                        <span className="text-green-600 font-medium">
                          -{peoplePricing[index].discount}% {t("discount")}
                        </span>
                      )}
                      <span className="font-semibold">
                        ₾{peoplePricing[index].finalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    {t("passportPhoto")} {t("required")}
                  </label>

                  {person.passportPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={person.passportPreview || "/placeholder.svg"}
                        alt={t("passportPhoto")}
                        className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(person.id)}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 sm:h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-600 font-medium">
                        {t("uploadPassport")}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t("maxSize")}
                      </p>
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

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
            <button
              type="submit"
              disabled={submitInsurance.isPending}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-sm font-semibold"
            >
              {submitInsurance.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>{t("processing")}</span>
                </>
              ) : (
                <>
                  <Shield size={18} />
                  <span>
                    {t("proceedToPayment")} - ₾{totalPrice.toFixed(2)}
                  </span>
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              {t("paymentNote")}
              <br />
              {t("documentsNote")}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
