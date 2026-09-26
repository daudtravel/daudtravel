"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { adminInputClass } from "@/src/components/admin/form/FormFields";
import {
  HOTEL_CONTACT_TYPES,
  type HotelContactPayload,
  type HotelContactType,
} from "@/src/types/admin/hotels.types";
import { cn } from "@/src/utlis/cn";

export const emptyContact = (): HotelContactPayload => ({
  type: "RECEPTION",
  name: "",
  phone: "",
  email: "",
  note: "",
});

/** A hotel has several numbers: reception, sales, the manager… */
export default function ContactsField({
  value,
  onChange,
  disabled,
  error,
}: {
  value: HotelContactPayload[];
  onChange: (value: HotelContactPayload[]) => void;
  disabled?: boolean;
  /** Index of the row that has no phone and no email. */
  error?: number | null;
}) {
  const t = useTranslations("admin");

  const update = (index: number, patch: Partial<HotelContactPayload>) =>
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const remove = (index: number) =>
    onChange(value.filter((_, i) => i !== index));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700">
          {t("hotels.contacts")}
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...value, emptyContact()])}
        >
          <Plus />
          {t("hotels.addContact")}
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
          {t("hotels.noContacts")}
        </p>
      ) : (
        <ul className="space-y-3">
          {value.map((contact, index) => (
            <li
              key={index}
              className={cn(
                "rounded-xl border p-3",
                error === index
                  ? "border-red-300 bg-red-50/50"
                  : "border-gray-200 bg-gray-50/50"
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    aria-label={t("hotels.moveUp")}
                    disabled={disabled || index === 0}
                    onClick={() => move(index, -1)}
                    className="text-gray-300 transition-colors hover:text-brand-green disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={t("hotels.moveDown")}
                    disabled={disabled || index === value.length - 1}
                    onClick={() => move(index, 1)}
                    className="text-gray-300 transition-colors hover:text-brand-green disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <Select
                  value={contact.type}
                  onValueChange={(next) =>
                    update(index, { type: next as HotelContactType })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger className="h-10 w-48 rounded-xl border-gray-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOTEL_CONTACT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`hotels.contactTypes.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={contact.name ?? ""}
                  onChange={(e) => update(index, { name: e.target.value })}
                  placeholder={t("hotels.contactName")}
                  disabled={disabled}
                  maxLength={120}
                  className={cn(adminInputClass, "h-10 flex-1 bg-white")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  onClick={() => remove(index)}
                  aria-label={t("common.delete")}
                  className="shrink-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 />
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <Input
                  value={contact.phone ?? ""}
                  onChange={(e) => update(index, { phone: e.target.value })}
                  placeholder={t("users.phone")}
                  disabled={disabled}
                  maxLength={40}
                  dir="ltr"
                  className={cn(adminInputClass, "h-10 bg-white")}
                />
                <Input
                  value={contact.email ?? ""}
                  onChange={(e) => update(index, { email: e.target.value })}
                  placeholder={t("users.email")}
                  disabled={disabled}
                  maxLength={254}
                  dir="ltr"
                  className={cn(adminInputClass, "h-10 bg-white")}
                />
                <Input
                  value={contact.note ?? ""}
                  onChange={(e) => update(index, { note: e.target.value })}
                  placeholder={t("hotels.contactNote")}
                  disabled={disabled}
                  maxLength={200}
                  className={cn(adminInputClass, "h-10 bg-white")}
                />
              </div>

              {error === index && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {t("hotels.contactNeedsPhoneOrEmail")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
