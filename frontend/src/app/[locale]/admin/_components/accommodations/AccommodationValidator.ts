import { z } from "zod";

export enum AccommodationType {
  HOTEL = "HOTEL",
  APARTMENT = "APARTMENT",
}

export const SUPPORTED_LOCALES = ["ka", "en", "ru", "tr", "ar"] as const;

const localizationSchema = z.object({
  locale: z.string(),
  name: z.string().optional().default(""),
  description: z.string().optional().default(""),
  address: z.string().optional().default(""),
});

export const accommodationFormSchema = z.object({
  type: z.nativeEnum(AccommodationType).default(AccommodationType.HOTEL),
  localizations: z
    .array(localizationSchema)
    .refine(
      (locs) =>
        locs.some((l) => l.name?.trim() && l.description?.trim()),
      { message: "მინიმუმ ერთი სრული თარგმანი აუცილებელია (დასახელება და აღწერა)" }
    ),
  city: z.string().min(1, "ქალაქი სავალდებულოა"),
  price: z.coerce.number().min(0, "ფასი უნდა იყოს დადებითი"),
  maxGuests: z.coerce.number().min(1, "მინიმუმ 1 სტუმარი").default(1),
  bedrooms: z.coerce.number().min(0).default(1),
  bathrooms: z.coerce.number().min(0).default(1),
  amenities: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  // Images are managed via separate File/URL state, validated at submit
  mainImage: z.string().default(""),
  gallery: z.array(z.string()).default([]),
});

export type AccommodationFormData = z.infer<typeof accommodationFormSchema>;
