"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  CUSTOM_ROOM_TYPE_MAX_LENGTH,
  CUSTOM_ROOM_TYPES_MAX,
  ROOM_TYPES,
  cleanRoomTypeName,
  matchRoomType,
  type RoomType,
} from "@/src/constants/roomTypes";
import { useRoomTypeLabel } from "@/src/hooks/useRoomTypeLabel";
import { adminInputClass } from "./FormFields";
import { cn } from "@/src/utlis/cn";

/**
 * Chips for room types typed by hand. Enter, comma or leaving the field adds
 * what was typed; a pasted list is split on commas and line breaks. A name
 * that is already a predefined type ("Junior suite") goes to
 * onPredefinedMatch instead, so it is ticked rather than listed twice.
 * The ref and the aria-* props (from FormControl) reach the text box.
 */
const CustomRoomTypesInput = forwardRef<
  HTMLInputElement,
  {
    value: string[];
    onChange: (value: string[]) => void;
    onPredefinedMatch?: (type: RoomType) => void;
    placeholder?: string;
    disabled?: boolean;
    /** Typing direction of the input (rtl for Arabic). */
    dir?: "ltr" | "rtl";
    id?: string;
    ariaLabel?: string;
    invalid?: boolean;
    className?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean | "true" | "false";
  }
>(function CustomRoomTypesInput(
  {
    value,
    onChange,
    onPredefinedMatch,
    placeholder,
    disabled,
    dir,
    id,
    ariaLabel,
    invalid,
    className,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
  },
  ref
) {
  const t = useTranslations("admin.form");
  const label = useRoomTypeLabel();
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const full = value.length >= CUSTOM_ROOM_TYPES_MAX;
  const canAdd = !disabled && !full && !!draft.trim();
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";

  /** A typed comma that only continues a predefined label ("A, B") is text. */
  const continuesLabel = (text: string) => {
    const start = cleanRoomTypeName(text).toLocaleLowerCase();
    return ROOM_TYPES.some((type) =>
      cleanRoomTypeName(label(type)).toLocaleLowerCase().startsWith(start)
    );
  };

  const add = (raw: string) => {
    setDraft("");
    // The whole text first: a label may itself contain a comma
    const whole = matchRoomType(raw, label);
    const parts = whole
      ? [raw]
      : raw
          .split(/[,\n\r]+/)
          .map((part) =>
            cleanRoomTypeName(part).slice(0, CUSTOM_ROOM_TYPE_MAX_LENGTH).trim()
          )
          .filter(Boolean);
    if (!parts.length) return;

    const next = [...value];
    let message: string | null = null;
    for (const name of parts) {
      const type = matchRoomType(name, label);
      if (type) {
        onPredefinedMatch?.(type);
        message = t("roomTypeMatched", { name: label(type) });
        continue;
      }
      const lower = name.toLocaleLowerCase();
      if (next.some((item) => item.toLocaleLowerCase() === lower)) {
        message = t("roomTypeDuplicate", { name });
        continue;
      }
      if (next.length >= CUSTOM_ROOM_TYPES_MAX) {
        message = t("roomTypesLimit", { max: CUSTOM_ROOM_TYPES_MAX });
        break;
      }
      next.push(name);
    }
    if (next.length !== value.length) onChange(next);
    setNote(message);
  };

  const remove = (name: string, index: number) => {
    // Removing with the keyboard keeps focus nearby: the next chip, else the
    // previous one, else the text box (a dialog would otherwise take it)
    const buttons =
      listRef.current?.querySelectorAll<HTMLButtonElement>("li > button");
    if (buttons && document.activeElement === buttons[index]) {
      const neighbour = buttons[index + 1] ?? buttons[index - 1];
      (neighbour ?? inputRef.current)?.focus();
    }
    onChange(value.filter((item) => item !== name));
    setNote(null);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {value.length > 0 && (
        <ul ref={listRef} className="flex flex-wrap gap-1.5">
          {value.map((name, index) => (
            <li
              key={name}
              className="inline-flex max-w-full items-center gap-1 rounded-lg bg-brand-green-50 py-1 pe-1 ps-2.5 text-sm font-medium text-brand-green"
            >
              <span dir="auto" className="break-words">
                {name}
              </span>
              <button
                type="button"
                onClick={() => remove(name, index)}
                disabled={disabled}
                aria-label={t("removeItem", { item: name })}
                className="shrink-0 rounded-md p-0.5 text-brand-green/60 transition-colors hover:bg-brand-green/10 hover:text-brand-green disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          id={id}
          value={draft}
          // Empty, the box follows the page so its placeholder reads right
          dir={draft ? dir : undefined}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-invalid={isInvalid || undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            if (note) setNote(null);
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            } else if (e.key === ",") {
              if (continuesLabel(draft + ",")) return;
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (/[,\n\r]/.test(text)) {
              e.preventDefault();
              add(draft + text);
            }
          }}
          onBlur={() => add(draft)}
          placeholder={
            full
              ? t("roomTypesLimit", { max: CUSTOM_ROOM_TYPES_MAX })
              : placeholder ?? t("customRoomTypePlaceholder")
          }
          disabled={disabled || full}
          maxLength={CUSTOM_ROOM_TYPE_MAX_LENGTH}
          className={cn(
            adminInputClass,
            isInvalid && "border-red-300 focus:border-red-400"
          )}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          // Keep focus in the input so its blur doesn't add the draft first
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => canAdd && add(draft)}
          // Not `disabled`: Tab out of the box adds the draft, and a button
          // turning disabled at that moment would drop keyboard focus
          disabled={disabled}
          aria-disabled={!canAdd || undefined}
          aria-label={t("addItem")}
        >
          <Plus />
        </Button>
      </div>

      {/* Always mounted, so screen readers announce the text when it changes */}
      <p
        aria-live="polite"
        className={cn("text-xs text-gray-500", !note && "sr-only")}
      >
        {note}
      </p>
    </div>
  );
});

export default CustomRoomTypesInput;
