"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Form } from "@/src/components/ui/form";
import {
  SwitchField,
  TextField,
  TextareaField,
} from "@/src/components/admin/form/FormFields";
import SelectField from "@/src/components/admin/form/SelectField";
import RoomTypePicker from "@/src/components/admin/form/RoomTypePicker";
import CustomRoomTypesInput from "@/src/components/admin/form/CustomRoomTypesInput";
import { useSaveHotel } from "@/src/hooks/admin/useHotels";
import { useListingOptions } from "@/src/hooks/admin/useAdminLists";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { useUsersLookup } from "@/src/hooks/admin/useAccess";
import {
  getApiErrorCode,
  getApiStatus,
  useApiErrorMessage,
} from "@/src/utlis/admin/errors";
import { fullName } from "@/src/utlis/admin/format";
import { CURRENCIES } from "@/src/types/admin/currency.types";
import {
  HOTEL_CATEGORIES,
  type Hotel,
  type HotelCategory,
  type HotelContactPayload,
} from "@/src/types/admin/hotels.types";
import {
  pickLocalization,
  type ListingOption,
} from "@/src/types/admin/website.types";
import {
  CUSTOM_ROOM_TYPES_MAX,
  dedupeCustomRoomTypes,
  sortRoomTypes,
  type RoomType,
} from "@/src/constants/roomTypes";
import ContactsField, { emptyContact } from "./ContactsField";
import ListingPicker, { listingSearchHandlesEscape } from "./ListingPicker";

type FormValues = {
  name: string;
  city: string;
  region: string;
  address: string;
  stars: string;
  category: HotelCategory;
  priceFrom: string;
  priceCurrency: string;
  website: string;
  commissionRate: string;
  notes: string;
  isActive: boolean;
  createdById: string;
};

const EMPTY: FormValues = {
  name: "",
  city: "",
  region: "",
  address: "",
  stars: "",
  category: "STANDARD",
  priceFrom: "",
  priceCurrency: "GEL",
  website: "",
  commissionRate: "",
  notes: "",
  isActive: true,
  createdById: "",
};

const TEXT_FIELDS = ["name", "city", "address"] as const;

/** Languages tried, in order, for a listing's custom room types. */
const LISTING_LOCALES = ["ka", "en", "ru", "tr", "ar"];

type ListingLocalization = ListingOption["localizations"][number];

/**
 * Listings keep custom room types per language, hotels one list: those of
 * the language the name comes from, else of the first language that has some.
 */
function listingCustomRoomTypes(
  listing: ListingOption,
  loc: ListingLocalization | undefined
): string[] {
  if (loc?.customRoomTypes.length) return loc.customRoomTypes;
  for (const code of LISTING_LOCALES) {
    const names = listing.localizations.find(
      (item) => item.locale === code
    )?.customRoomTypes;
    if (names?.length) return names;
  }
  return [];
}

/** What a website listing brings to the form, clipped to the hotel limits. */
function listingValues(listing: ListingOption, locale: string) {
  const loc = pickLocalization(listing.localizations, locale);
  const price = Number(listing.price);

  return {
    text: {
      name: loc?.name.trim().slice(0, 160) ?? "",
      city: listing.city.trim().slice(0, 120),
      address: loc?.address.trim().slice(0, 300) ?? "",
    },
    // Listing prices are always GEL per night
    priceFrom: Number.isFinite(price) ? String(price) : "",
    roomTypes: sortRoomTypes(listing.roomTypes),
    customRoomTypes: dedupeCustomRoomTypes(
      listingCustomRoomTypes(listing, loc)
    ),
  };
}

export default function HotelFormDialog({
  open,
  hotel,
  initialListingId = null,
  focusListing = false,
  onOpenChange,
}: {
  open: boolean;
  /** null = create */
  hotel: Hotel | null;
  /** Website listing a new entry starts from (create only). */
  initialListingId?: string | null;
  /** Open on the listing picker rather than the name (edit). */
  focusListing?: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("admin");
  const tAcc = useTranslations("accommodations");
  const locale = useLocale();
  const errorMessage = useApiErrorMessage();
  const saveHotel = useSaveHotel();
  const listings = useListingOptions(open);
  const refetchListings = listings.refetch;
  const { canAll } = usePermissions();
  const canReassign = canAll("HOTELS", "edit");
  const owners = useUsersLookup(false, canReassign && open);
  const fieldId = useId();

  const [contacts, setContacts] = useState<HotelContactPayload[]>([]);
  const [contactError, setContactError] = useState<number | null>(null);
  const [accommodationId, setAccommodationId] = useState<string | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [customRoomTypes, setCustomRoomTypes] = useState<string[]>([]);
  const [listingError, setListingError] = useState<string | null>(null);
  /** The form shows this opening's starting values (see initialListingId). */
  const [ready, setReady] = useState(false);
  const initialListingApplied = useRef(false);
  const initialListingRefetched = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t("form.required"))
          .max(160, t("form.tooLong", { max: 160 })),
        city: z
          .string()
          .trim()
          .min(1, t("form.required"))
          .max(120, t("form.tooLong", { max: 120 })),
        region: z
          .string()
          .trim()
          .max(120, t("form.tooLong", { max: 120 })),
        address: z
          .string()
          .trim()
          .max(300, t("form.tooLong", { max: 300 })),
        stars: z.string().refine((value) => {
          if (!value.trim()) return true;
          const num = Number(value);
          return Number.isInteger(num) && num >= 1 && num <= 5;
        }, t("hotels.starsRange")),
        category: z.enum(HOTEL_CATEGORIES),
        priceFrom: z.string().refine((value) => {
          if (!value.trim()) return true;
          const num = Number(value.replace(",", "."));
          return Number.isFinite(num) && num >= 0;
        }, t("hotels.priceInvalid")),
        priceCurrency: z.string(),
        website: z
          .string()
          .trim()
          .max(300, t("form.tooLong", { max: 300 })),
        commissionRate: z.string().refine((value) => {
          if (!value.trim()) return true;
          const num = Number(value.replace(",", "."));
          return Number.isFinite(num) && num >= 0 && num <= 100;
        }, t("partners.rateRange")),
        notes: z
          .string()
          .trim()
          .max(2000, t("form.tooLong", { max: 2000 })),
        isActive: z.boolean(),
        createdById: z.string(),
      }),
    [t]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) {
      setReady(false);
      initialListingApplied.current = false;
      initialListingRefetched.current = false;
      return;
    }
    setContactError(null);
    setListingError(null);
    setContacts(
      hotel
        ? hotel.contacts.map((contact) => ({
            type: contact.type,
            name: contact.name ?? "",
            phone: contact.phone ?? "",
            email: contact.email ?? "",
            note: contact.note ?? "",
          }))
        : [emptyContact()]
    );
    setAccommodationId(hotel?.accommodationId ?? null);
    setRoomTypes(hotel?.roomTypes ?? []);
    setCustomRoomTypes(hotel?.customRoomTypes ?? []);
    form.reset(
      hotel
        ? {
            name: hotel.name,
            city: hotel.city,
            region: hotel.region ?? "",
            address: hotel.address ?? "",
            stars: hotel.stars !== null ? String(hotel.stars) : "",
            category: hotel.category,
            priceFrom: hotel.priceFrom !== null ? String(hotel.priceFrom) : "",
            priceCurrency: hotel.priceCurrency ?? "GEL",
            website: hotel.website ?? "",
            commissionRate:
              hotel.commissionRate !== null ? String(hotel.commissionRate) : "",
            notes: hotel.notes ?? "",
            isActive: hotel.isActive,
            createdById: hotel.createdById ?? "",
          }
        : EMPTY
    );
    setReady(true);
  }, [open, hotel, form]);

  /** Picking a listing links it and fills in what is still empty. */
  const selectListing = useCallback(
    (listing: ListingOption) => {
      const from = listingValues(listing, locale);
      const current = form.getValues();
      const options = { shouldDirty: true, shouldValidate: true };
      let filled = false;

      for (const field of TEXT_FIELDS) {
        if (from.text[field] && !current[field].trim()) {
          form.setValue(field, from.text[field], options);
          filled = true;
        }
      }
      if (from.priceFrom && !current.priceFrom.trim()) {
        form.setValue("priceFrom", from.priceFrom, options);
        form.setValue("priceCurrency", "GEL", { shouldDirty: true });
        filled = true;
      }
      if (from.roomTypes.some((type) => !roomTypes.includes(type))) {
        setRoomTypes(sortRoomTypes([...roomTypes, ...from.roomTypes]));
        filled = true;
      }
      const custom = dedupeCustomRoomTypes([
        ...customRoomTypes,
        ...from.customRoomTypes,
      ]).slice(0, CUSTOM_ROOM_TYPES_MAX);
      if (custom.length > customRoomTypes.length) {
        setCustomRoomTypes(custom);
        filled = true;
      }

      setAccommodationId(listing.id);
      setListingError(null);
      if (filled) toast.success(t("hotels.listingFilled"));
    },
    [form, locale, roomTypes, customRoomTypes, t]
  );

  /** "Copy details from the listing": its values replace the form's. */
  const copyListing = (listing: ListingOption) => {
    const from = listingValues(listing, locale);
    const options = { shouldDirty: true, shouldValidate: true };

    for (const field of TEXT_FIELDS) {
      // A blank on the listing doesn't wipe what was typed here
      if (from.text[field]) form.setValue(field, from.text[field], options);
    }
    if (from.priceFrom) {
      form.setValue("priceFrom", from.priceFrom, options);
      form.setValue("priceCurrency", "GEL", { shouldDirty: true });
    }
    setRoomTypes(from.roomTypes);
    setCustomRoomTypes(from.customRoomTypes.slice(0, CUSTOM_ROOM_TYPES_MAX));
    setAccommodationId(listing.id);
    setListingError(null);
    toast.success(t("hotels.listingCopied"));
  };

  /**
   * A new entry started from a website listing ("Add to the hotel
   * directory"): applied once per opening, after the reset above has
   * rendered so the fill sees this opening's values.
   */
  useEffect(() => {
    if (!ready || hotel || !initialListingId || !listings.data) return;
    if (initialListingApplied.current) return;
    // Cached options can predate the listing (just created) or its unlinking:
    // wait for a refetch in flight, and ask once more before giving up
    if (listings.isFetching) return;
    const listing = listings.data.find((item) => item.id === initialListingId);
    if ((!listing || listing.linked) && !initialListingRefetched.current) {
      initialListingRefetched.current = true;
      void refetchListings();
      return;
    }
    initialListingApplied.current = true;

    if (!listing) {
      toast.error(t("errors.ACCOMMODATION_NOT_FOUND"));
    } else if (listing.linked) {
      toast.error(t("hotels.listingAlreadyInDirectory"));
    } else {
      selectListing(listing);
    }
  }, [
    ready,
    hotel,
    initialListingId,
    listings.data,
    listings.isFetching,
    refetchListings,
    selectListing,
    t,
  ]);

  const onSubmit = async (values: FormValues) => {
    // Drop rows the user added but never filled in
    const filled = contacts.filter(
      (contact) =>
        contact.name?.trim() ||
        contact.phone?.trim() ||
        contact.email?.trim() ||
        contact.note?.trim()
    );
    const invalid = filled.findIndex(
      (contact) => !contact.phone?.trim() && !contact.email?.trim()
    );
    if (invalid >= 0) {
      setContactError(invalid);
      toast.error(t("hotels.contactNeedsPhoneOrEmail"));
      return;
    }
    setContactError(null);

    try {
      await saveHotel.mutateAsync({
        id: hotel?.id,
        payload: {
          name: values.name.trim(),
          city: values.city.trim(),
          region: values.region.trim() || null,
          address: values.address.trim() || null,
          stars: values.stars.trim() ? Number(values.stars) : null,
          category: values.category,
          priceFrom: values.priceFrom.trim()
            ? Number(values.priceFrom.replace(",", "."))
            : null,
          priceCurrency: values.priceFrom.trim() ? values.priceCurrency : null,
          website: values.website.trim() || null,
          commissionRate: values.commissionRate.trim()
            ? Number(values.commissionRate.replace(",", "."))
            : null,
          notes: values.notes.trim() || null,
          isActive: values.isActive,
          contacts: filled.map((contact, index) => ({
            type: contact.type,
            name: contact.name?.trim() || null,
            phone: contact.phone?.trim() || null,
            email: contact.email?.trim() || null,
            note: contact.note?.trim() || null,
            sortOrder: index,
          })),
          roomTypes,
          customRoomTypes: dedupeCustomRoomTypes(customRoomTypes),
          // Always sent: null unlinks the listing
          accommodationId,
          ...(canReassign &&
            values.createdById && { createdById: values.createdById }),
        },
      });
      toast.success(hotel ? t("hotels.updated") : t("hotels.created"));
      onOpenChange(false);
    } catch (error) {
      const message = errorMessage(error);
      toast.error(message);
      const code = getApiErrorCode(error);
      if (
        code === "ACCOMMODATION_ALREADY_LINKED" ||
        code === "ACCOMMODATION_NOT_FOUND"
      ) {
        setListingError(message);
        // The picker's list is out of date
        void listings.refetch();
      } else if (getApiStatus(error) === 400) {
        form.setError("name", { message });
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !saveHotel.isPending && onOpenChange(next)}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl"
        onOpenAutoFocus={(event) => {
          // Editing starts at the name; a new entry at the listing picker
          const name =
            hotel && !focusListing
              ? formRef.current?.querySelector<HTMLInputElement>(
                  'input[name="name"]'
                )
              : null;
          if (name) {
            event.preventDefault();
            name.focus();
            name.select();
          }
        }}
        onEscapeKeyDown={(event) => {
          // Escape in the listing search backs out of "Change" instead
          if (listingSearchHandlesEscape(event.target)) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {hotel ? t("hotels.edit") : t("hotels.new")}
          </DialogTitle>
          <DialogDescription>{t("hotels.formHint")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            ref={formRef}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <label
                htmlFor={`${fieldId}listing`}
                className="text-sm font-semibold text-gray-700"
              >
                {t("hotels.listing")}
              </label>
              <ListingPicker
                value={accommodationId}
                currentHotelId={hotel?.id ?? null}
                fallback={hotel?.accommodation}
                enabled={open}
                disabled={saveHotel.isPending}
                onSelect={selectListing}
                onCopy={copyListing}
                onClear={() => {
                  setAccommodationId(null);
                  setListingError(null);
                }}
                error={listingError}
                inputId={`${fieldId}listing`}
              />
              <p className="text-xs text-gray-500">{t("hotels.listingHint")}</p>
            </div>

            <TextField
              control={form.control}
              name="name"
              label={t("hotels.name")}
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="city"
                label={t("hotels.city")}
                required
              />
              <TextField
                control={form.control}
                name="region"
                label={t("hotels.region")}
                hint={t("hotels.regionHint")}
              />
            </div>

            <TextField
              control={form.control}
              name="address"
              label={t("hotels.address")}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label={t("hotels.category")}
                value={form.watch("category")}
                onChange={(value) =>
                  form.setValue("category", value as HotelCategory, {
                    shouldDirty: true,
                  })
                }
                options={HOTEL_CATEGORIES.map((category) => ({
                  value: category,
                  label: t(`hotels.categories.${category}`),
                }))}
              />
              <TextField
                control={form.control}
                name="stars"
                label={t("hotels.stars")}
                inputMode="numeric"
                placeholder="4"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                control={form.control}
                name="priceFrom"
                label={t("hotels.priceFrom")}
                hint={t("hotels.priceHint")}
                inputMode="decimal"
                className="sm:col-span-2"
              />
              <SelectField
                label={t("hotels.currency")}
                value={form.watch("priceCurrency")}
                onChange={(value) =>
                  form.setValue("priceCurrency", value, { shouldDirty: true })
                }
                options={CURRENCIES.map((currency) => ({
                  value: currency,
                  label: currency,
                }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="commissionRate"
                label={t("hotels.commissionRate")}
                hint={t("hotels.commissionHint")}
                inputMode="decimal"
                suffix="%"
              />
              <TextField
                control={form.control}
                name="website"
                label={t("hotels.website")}
                dir="ltr"
                placeholder="https://"
              />
            </div>

            <div className="space-y-1.5">
              <p
                id={`${fieldId}room-types`}
                className="text-sm font-semibold text-gray-700"
              >
                {tAcc("roomTypes")}
              </p>
              <div role="group" aria-labelledby={`${fieldId}room-types`}>
                <RoomTypePicker
                  value={roomTypes}
                  onChange={setRoomTypes}
                  disabled={saveHotel.isPending}
                />
              </div>
              <p className="text-xs text-gray-500">
                {t("hotels.roomTypesHint")}
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={`${fieldId}custom-room-types`}
                className="text-sm font-semibold text-gray-700"
              >
                {t("hotels.customRoomTypes")}
              </label>
              <CustomRoomTypesInput
                id={`${fieldId}custom-room-types`}
                value={customRoomTypes}
                onChange={setCustomRoomTypes}
                onPredefinedMatch={(code) =>
                  setRoomTypes((prev) => sortRoomTypes([...prev, code]))
                }
                disabled={saveHotel.isPending}
              />
              <p className="text-xs text-gray-500">
                {t("hotels.customRoomTypesHint")}
              </p>
            </div>

            <ContactsField
              value={contacts}
              onChange={(next) => {
                setContacts(next);
                setContactError(null);
              }}
              disabled={saveHotel.isPending}
              error={contactError}
            />

            <TextareaField
              control={form.control}
              name="notes"
              label={t("common.notes")}
              rows={3}
            />

            <SwitchField
              control={form.control}
              name="isActive"
              label={t("hotels.isActive")}
              hint={t("hotels.isActiveHint")}
            />

            {canReassign && (
              <SelectField
                label={t("common.owner")}
                value={form.watch("createdById")}
                onChange={(value) =>
                  form.setValue("createdById", value, { shouldDirty: true })
                }
                emptyLabel={t("common.me")}
                options={(owners.data ?? []).map((owner) => ({
                  value: owner.id,
                  label: fullName(owner),
                }))}
              />
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saveHotel.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saveHotel.isPending}>
                {saveHotel.isPending && <Loader2 className="animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
