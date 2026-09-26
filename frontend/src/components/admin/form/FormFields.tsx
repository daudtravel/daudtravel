"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import { Textarea } from "@/src/components/ui/textarea";
import { cn } from "@/src/utlis/cn";

export const adminInputClass =
  "h-11 rounded-xl border-gray-200 bg-white focus:border-brand-green focus-visible:ring-2 focus-visible:ring-brand-green/15";

interface BaseFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function RequiredMark() {
  return (
    <span className="ms-0.5 text-red-500" aria-hidden>
      *
    </span>
  );
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  required,
  disabled,
  className,
  type = "text",
  placeholder,
  autoComplete,
  dir,
  inputMode,
  maxLength,
  suffix,
}: BaseFieldProps<T> & {
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  dir?: "ltr" | "rtl" | "auto";
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  suffix?: React.ReactNode;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("space-y-1.5", className)}>
          <FormLabel className="text-sm font-semibold text-gray-700">
            {label}
            {required && <RequiredMark />}
          </FormLabel>
          <div className="relative">
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                type={type}
                placeholder={placeholder}
                autoComplete={autoComplete}
                disabled={disabled}
                dir={dir}
                inputMode={inputMode}
                maxLength={maxLength}
                className={cn(adminInputClass, suffix ? "pe-14" : undefined)}
              />
            </FormControl>
            {suffix && (
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                {suffix}
              </span>
            )}
          </div>
          {hint && (
            <FormDescription className="text-xs text-gray-500">
              {hint}
            </FormDescription>
          )}
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  required,
  disabled,
  className,
  rows = 4,
  placeholder,
  maxLength,
}: BaseFieldProps<T> & {
  rows?: number;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("space-y-1.5", className)}>
          <FormLabel className="text-sm font-semibold text-gray-700">
            {label}
            {required && <RequiredMark />}
          </FormLabel>
          <FormControl>
            <Textarea
              {...field}
              value={field.value ?? ""}
              rows={rows}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              className="rounded-xl border-gray-200 focus:border-brand-green focus-visible:ring-2 focus-visible:ring-brand-green/15"
            />
          </FormControl>
          {hint && (
            <FormDescription className="text-xs text-gray-500">
              {hint}
            </FormDescription>
          )}
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}

export function SwitchField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  disabled,
  className,
}: BaseFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex items-start justify-between gap-4 space-y-0 rounded-xl border border-gray-100 bg-gray-50/50 p-4",
            className
          )}
        >
          <div className="space-y-0.5">
            <FormLabel className="text-sm font-semibold text-gray-800">
              {label}
            </FormLabel>
            {hint && (
              <FormDescription className="text-xs text-gray-500">
                {hint}
              </FormDescription>
            )}
          </div>
          <FormControl>
            <Switch
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
