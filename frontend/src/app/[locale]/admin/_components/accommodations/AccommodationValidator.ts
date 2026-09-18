import { z } from "zod";

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
});

export const accommodationFormSchema = (t: Translate) =>
  z.object({
    type: z.nativeEnum(AccommodationType).default(AccommodationType.HOTEL),
    localizations: z
      .array(localizationSchema)
      .refine(
        (locs) =>
          locs.some((l) => l.name?.trim() && l.description?.trim()),
        { message: t("accommodations.validation.minOneTranslation") }
      ),
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
    isPublic: z.boolean().default(false),
    // Images are managed via separate File/URL state, validated at submit
    mainImage: z.string().default(""),
    gallery: z.array(z.string()).default([]),
  });

export type AccommodationFormData = z.infer<
  ReturnType<typeof accommodationFormSchema>
>;
