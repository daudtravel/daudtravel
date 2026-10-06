"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Check,
  EyeOff,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Unlink,
} from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import Thumb from "@/src/components/admin/common/Thumb";
import { adminInputClass } from "@/src/components/admin/form/FormFields";
import { useListingOptions } from "@/src/hooks/admin/useAdminLists";
import { formatMoney } from "@/src/utlis/admin/format";
import {
  pickLocalization,
  type ListingOption,
} from "@/src/types/admin/website.types";
import type { HotelListing } from "@/src/types/admin/hotels.types";
import { cn } from "@/src/utlis/cn";

/** Further matches wait until the search narrows them down. */
const MAX_SHOWN = 50;

/** Action buttons whose labels may wrap instead of widening the dialog. */
const ACTION_WRAP = "h-auto min-h-9 max-w-full whitespace-normal py-1.5 text-start";

/**
 * True for an Escape pressed in the search box while it backs out of
 * "Change". Radix closes a dialog on Escape before the box sees the key, so
 * the dialog's onEscapeKeyDown has to let these through.
 */
export const listingSearchHandlesEscape = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.dataset.cancelOnEscape === "true";

/** Case- and accent-insensitive form for matching ("İstanbul" ~ "istanbul"). */
const fold = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Thumbnail, name, city and badges of a website listing. */
function ListingLine({
  listing,
  taken,
  withPrice,
}: {
  listing: HotelListing;
  /** Already linked to another directory entry. */
  taken?: boolean;
  withPrice?: boolean;
}) {
  const t = useTranslations("admin");
  const tAcc = useTranslations("accommodations");
  const locale = useLocale();
  const name = pickLocalization(listing.localizations, locale)?.name;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Thumb
        src={listing.mainImage}
        className={withPrice ? "h-12 w-16" : "h-10 w-14"}
        sizes="64px"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">
          <span dir="auto">{name || "—"}</span>
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {listing.city}
          </span>
          {withPrice && (
            <span className="whitespace-nowrap">
              <span className="font-semibold tabular-nums text-gray-700">
                {formatMoney(listing.price, "GEL", locale)}
              </span>{" "}
              / {tAcc("perNight")}
            </span>
          )}
          <Badge tone={listing.type === "HOTEL" ? "blue" : "purple"}>
            {listing.type === "HOTEL" ? tAcc("hotel") : tAcc("apartment")}
          </Badge>
          {!listing.isPublic && (
            <Badge tone="neutral">
              <EyeOff />
              {t("website.hidden")}
            </Badge>
          )}
          {taken && <Badge tone="yellow">{t("hotels.listingTaken")}</Badge>}
        </div>
      </div>
    </div>
  );
}

/**
 * The website listing (Website → Hotels & apartments) a directory entry is
 * filled from and linked to. Inline rather than a popover: it sits in a
 * dialog. A listing linked to another entry is shown but can't be picked.
 */
export default function ListingPicker({
  value,
  currentHotelId,
  fallback,
  enabled,
  disabled,
  onSelect,
  onCopy,
  onClear,
  error,
  inputId,
}: {
  /** Id of the linked listing; null = not linked. */
  value: string | null;
  /** The entry being edited (null = new): its own listing stays pickable. */
  currentHotelId: string | null;
  /** The linked listing as the hotel record has it, if it isn't an option. */
  fallback?: HotelListing | null;
  /** Load the listings (only while the form is open). */
  enabled: boolean;
  disabled?: boolean;
  onSelect: (listing: ListingOption) => void;
  /** "Copy details from the listing" — overwrite the form with it. */
  onCopy: (listing: ListingOption) => void;
  onClear: () => void;
  error?: string | null;
  /** Id of the search box, for an outside <label>. */
  inputId?: string;
}) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const uid = useId();
  const searchId = inputId ?? `${uid}search`;
  const listboxId = `${uid}listbox`;
  const errorId = `${uid}error`;
  const optionId = (id: string) => `${uid}option-${id}`;

  const listings = useListingOptions(enabled);
  const [changing, setChanging] = useState(false);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const changeRef = useRef<HTMLButtonElement>(null);
  /** Where focus goes once the card and the search box have swapped. */
  const focusAfterSwap = useRef<"search" | "change" | null>(null);
  const searchFocused = useRef(false);

  const searching = !value || changing;

  useEffect(() => {
    // A listing applied from outside replaced the focused search box
    const target =
      focusAfterSwap.current ??
      (!searching && searchFocused.current ? "change" : null);
    focusAfterSwap.current = null;
    searchFocused.current = false;
    if (target === "search") searchRef.current?.focus();
    else if (target === "change") changeRef.current?.focus();
  }, [searching]);

  const entries = useMemo(
    () =>
      (listings.data ?? [])
        .map((listing) => ({
          listing,
          name: pickLocalization(listing.localizations, locale)?.name ?? "",
          text: fold(
            [
              listing.city,
              ...listing.localizations.map((loc) => loc.name),
            ].join("\n")
          ),
          // Linked to another entry (whose id may be hidden from this user)
          taken: listing.linked && listing.hotelId !== currentHotelId,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, locale)),
    [listings.data, locale, currentHotelId]
  );

  const needle = fold(query.trim());
  const matches = needle
    ? entries.filter((entry) => entry.text.includes(needle))
    : entries;
  const shown = matches.slice(0, MAX_SHOWN);

  let activeIndex = activeId
    ? shown.findIndex((entry) => entry.listing.id === activeId)
    : -1;
  // While typing, Enter takes the first match that can be picked
  if (activeIndex < 0 && needle) {
    activeIndex = shown.findIndex((entry) => !entry.taken);
  }
  const active = activeIndex >= 0 ? shown[activeIndex] : undefined;

  const selected = value
    ? listings.data?.find((listing) => listing.id === value)
    : undefined;
  const linked: HotelListing | undefined =
    selected ?? (fallback && fallback.id === value ? fallback : undefined);
  const selectedTaken =
    !!selected?.linked && selected.hotelId !== currentHotelId;

  const pick = (listing: ListingOption) => {
    focusAfterSwap.current = "change";
    setChanging(false);
    setQuery("");
    setActiveId(null);
    onSelect(listing);
  };

  const startChange = () => {
    focusAfterSwap.current = "search";
    setChanging(true);
  };

  const cancelChange = () => {
    focusAfterSwap.current = "change";
    setChanging(false);
    setQuery("");
    setActiveId(null);
  };

  const unlink = () => {
    focusAfterSwap.current = "search";
    setChanging(false);
    setQuery("");
    setActiveId(null);
    onClear();
  };

  const move = (step: 1 | -1) => {
    if (!shown.length) return;
    const next =
      activeIndex < 0
        ? step === 1
          ? 0
          : shown.length - 1
        : (activeIndex + step + shown.length) % shown.length;
    const id = shown[next].listing.id;
    setActiveId(id);
    document.getElementById(optionId(id))?.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Enter") {
      // Never submits the hotel form
      event.preventDefault();
      if (active && !active.taken) pick(active.listing);
    } else if (event.key === "Escape" && changing) {
      cancelChange();
    }
  };

  const results = listings.isPending ? (
    <p
      role="status"
      className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500"
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      {t("common.loading")}
    </p>
  ) : listings.isError && !listings.data ? (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50/50 px-3 py-2.5 text-sm text-red-700">
      {t("hotels.listingLoadFailed")}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="bg-white"
        onClick={() => void listings.refetch()}
        disabled={listings.isFetching}
      >
        <RefreshCw className={cn(listings.isFetching && "animate-spin")} />
        {t("list.retry")}
      </Button>
    </div>
  ) : !entries.length ? (
    <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
      {t("hotels.listingNoneYet")}
    </p>
  ) : !shown.length ? (
    <p
      role="status"
      className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500"
    >
      {t("hotels.listingEmpty")}
    </p>
  ) : (
    <>
      <ul
        id={listboxId}
        role="listbox"
        aria-label={t("hotels.listingPick")}
        className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1"
      >
        {shown.map((entry, index) => {
          const isActive = index === activeIndex;
          return (
            <li
              key={entry.listing.id}
              id={optionId(entry.listing.id)}
              role="option"
              aria-selected={isActive}
              aria-disabled={entry.taken || undefined}
              // Keeps focus (and the keyboard) in the search box
              onMouseDown={(e) => e.preventDefault()}
              onMouseMove={() => {
                if (!isActive) setActiveId(entry.listing.id);
              }}
              onClick={() => {
                if (!entry.taken && !disabled) pick(entry.listing);
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5",
                entry.taken
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer",
                isActive && (entry.taken ? "bg-gray-50" : "bg-brand-green-50")
              )}
            >
              <ListingLine listing={entry.listing} taken={entry.taken} />
              {entry.listing.id === value && (
                <>
                  <Check
                    className="h-4 w-4 shrink-0 text-brand-green"
                    aria-hidden
                  />
                  <span className="sr-only">{t("hotels.listingLinked")}</span>
                </>
              )}
            </li>
          );
        })}
      </ul>
      {matches.length > shown.length && (
        <p className="text-xs text-gray-500">
          {t("list.more", { count: matches.length - shown.length })}
        </p>
      )}
    </>
  );

  return (
    <div className="space-y-2">
      {searching ? (
        <>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                ref={searchRef}
                id={searchId}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={shown.length > 0}
                aria-controls={shown.length > 0 ? listboxId : undefined}
                aria-activedescendant={
                  active ? optionId(active.listing.id) : undefined
                }
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                data-cancel-on-escape={changing ? "true" : undefined}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveId(null);
                }}
                onKeyDown={onKeyDown}
                onFocus={() => {
                  searchFocused.current = true;
                }}
                onBlur={() => {
                  searchFocused.current = false;
                }}
                placeholder={t("hotels.listingSearch")}
                autoComplete="off"
                maxLength={200}
                disabled={disabled}
                className={cn(
                  adminInputClass,
                  "ps-9",
                  error && "border-red-300 focus:border-red-400"
                )}
              />
            </div>
            {changing && (
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={cancelChange}
                disabled={disabled}
              >
                {t("common.cancel")}
              </Button>
            )}
          </div>
          {results}
        </>
      ) : (
        <div
          role="group"
          aria-label={t("hotels.listing")}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "rounded-xl border p-3",
            error
              ? "border-red-300 bg-red-50/50"
              : "border-gray-200 bg-gray-50/50"
          )}
        >
          {linked ? (
            <ListingLine listing={linked} taken={selectedTaken} withPrice />
          ) : listings.isPending ? (
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("common.loading")}
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              {t("errors.ACCOMMODATION_NOT_FOUND")}
            </p>
          )}

          {/* Labels wrap: in Georgian "copy details" alone outgrows a phone */}
          <div className="mt-3 flex flex-wrap gap-2">
            {selected && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(ACTION_WRAP, "bg-white")}
                onClick={() => onCopy(selected)}
                disabled={disabled}
              >
                <RefreshCw />
                {t("hotels.listingCopy")}
              </Button>
            )}
            <Button
              ref={changeRef}
              type="button"
              variant="outline"
              size="sm"
              className={cn(ACTION_WRAP, "bg-white")}
              onClick={startChange}
              disabled={disabled}
            >
              {t("hotels.listingChange")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                ACTION_WRAP,
                "text-gray-500 hover:bg-red-50 hover:text-red-600"
              )}
              onClick={unlink}
              disabled={disabled}
            >
              <Unlink />
              {t("hotels.listingUnlink")}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p id={errorId} className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
