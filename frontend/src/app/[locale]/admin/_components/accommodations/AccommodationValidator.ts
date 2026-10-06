import { z } from "zod";
import { ROOM_TYPES } from "@/src/constants/roomTypes";

export enum AccommodationType {
  HOTEL = "HOTEL",
  APARTMENT = "APARTMENT",
}

export const SUPPORTED_LOCALES = ["ka", "en", "ru", "tr", "ar"] as const;

// Translator for the "admin" namespace (validation messages are localized)
type Translate = (key: string) => string;

const localizationSchema = z.object({
  locale: z.string(),
  name: z.string().optional().default(""),
  description: z.string().optional().default(""),
  address: z.string().optional().default(""),
  // Room types typed by hand, written in this language
  customRoomTypes: z.array(z.string()).default([]),
});

/** A language is saved only when both its name and description are filled in. */
export const isLocalizationFilled = (loc: {
  name?: string;
  description?: string;
}) => !!(loc.name?.trim() && loc.description?.trim());

export const accommodationFormSchema = (t: Translate) =>
  z.object({
    type: z.nativeEnum(AccommodationType).default(AccommodationType.HOTEL),
    localizations: z
      .array(localizationSchema)
      .refine(
        (locs) =>
          locs.some((l) => l.name?.trim() && l.description?.trim()),
        { message: t("accommodations.validation.minOneTranslation") }
      )
      // Custom room types of a language that isn't saved would be lost
      .superRefine((locs, ctx) => {
        locs.forEach((loc, index) => {
          if (loc.customRoomTypes.length > 0 && !isLocalizationFilled(loc)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index, "customRoomTypes"],
              message: t(
                "accommodations.validation.customRoomTypesNeedTranslation"
              ),
            });
          }
        });
      }),
    city: z.string().min(1, t("accommodations.validation.cityRequired")),
    price: z.coerce
      .number()
      .min(0, t("accommodations.validation.pricePositive")),
    maxGuests: z.coerce
      .number()
      .min(1, t("accommodations.validation.minOneGuest"))
      .default(1),
    bedrooms: z.coerce.number().min(0).default(1),
    bathrooms: z.coerce.number().min(0).default(1),
    amenities: z.array(z.string()).default([]),
    roomTypes: z.array(z.enum(ROOM_TYPES)).default([]),
    isPublic: z.boolean().default(false),
    // Images are managed via separate File/URL state, validated at submit
    mainImage: z.string().default(""),
    gallery: z.array(z.string()).default([]),
  });

export type AccommodationFormData = z.infer<
  ReturnType<typeof accommodationFormSchema>
>;
