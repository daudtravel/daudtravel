"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Trash2, Upload, User } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { imageUrl } from "@/src/utlis/admin/media";
import { cn } from "@/src/utlis/cn";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Profile photo picker: shows the stored photo until a new file is chosen,
 * and can clear it (the form sends `removePhoto`).
 */
export default function PhotoField({
  label,
  hint,
  currentUrl,
  file,
  onFileChange,
  removed,
  onRemovedChange,
  disabled,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  currentUrl?: string | null;
  file: File | null;
  onFileChange: (file: File | null) => void;
  removed: boolean;
  onRemovedChange: (removed: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("admin.form");
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const stored = removed ? null : imageUrl(currentUrl);
  const shown = preview ?? stored;

  const pick = (next: File | null) => {
    setError(null);
    if (next && !next.type.startsWith("image/")) {
      setError(t("imageOnly"));
      return;
    }
    if (next && next.size > MAX_IMAGE_BYTES) {
      setError(t("imageTooLarge", { max: 8 }));
      return;
    }
    onFileChange(next);
    if (next) onRemovedChange(false);
  };

  const clear = () => {
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = "";
    if (currentUrl) onRemovedChange(true);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <div className="flex items-center gap-4">
        <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-gray-300">
          {shown ? (
            <Image
              src={shown}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
              unoptimized={!!preview}
            />
          ) : (
            <User className="h-7 w-7" />
          )}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            <Upload />
            {shown ? t("replacePhoto") : t("uploadPhoto")}
          </Button>
          {shown && (
            <Button
              type="button"
              variant="ghost"
              onClick={clear}
              disabled={disabled}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 />
              {t("removePhoto")}
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : (
        hint && <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}
