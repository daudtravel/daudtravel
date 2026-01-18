import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TourType } from "@/src/types/tours.type";

export const SUPPORTED_LOCALES = ["en", "ka", "ru", "ar", "tr"] as const;

const localizationSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES),
  name: z.string().optional(),
  startLocation: z.string().optional(),
  locations: z.array(z.string()).default([]),
  description: z.string().optional(),
});

const groupPricingSchema = z.object({
  totalPrice: z.coerce.number().min(0).optional(),
  reservationPrice: z.coerce.number().min(0).optional(),
  discountedPrice: z.coerce.number().min(0).optional(),
});

const individualPricingSchema = z.object({
  seasonTotalPrice: z.coerce.number().min(0),
  seasonReservationPrice: z.coerce.number().min(0),
  seasonDiscountedPrice: z.coerce.number().min(0),
  offSeasonTotalPrice: z.coerce.number().min(0),
  offSeasonReservationPrice: z.coerce.number().min(0),
  offSeasonDiscountedPrice: z.coerce.number().min(0),
});

export const editTourSchema = z
  .object({
    type: z.nativeEnum(TourType),
    localizations: z.array(localizationSchema).min(1),
    days: z.coerce.number().min(1),
    nights: z.coerce.number().min(0),
    mainImage: z.string().nullable(),
    gallery: z.array(z.string()).default([]),
    isPublic: z.boolean(),
    isDaily: z.boolean(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    groupPricing: groupPricingSchema.optional(),
    individualPricing: individualPricingSchema.optional(),
    maxPersons: z.coerce.number().min(1).optional(),
  })
  .refine(
    (data) =>
      data.localizations.some((loc) => loc.name && loc.name.trim().length > 0),
    {
      message: "მინიმუმ ერთი ენა უნდა იყოს შევსებული",
      path: ["localizations"],
    }
  );

export type EditTourFormData = z.infer<typeof editTourSchema>;

export const isLocalizationFilled = (loc: any): boolean => {
  return !!(loc.name && loc.name.trim().length > 0);
};

export const useEditTourForm = (tourId: string) => {
  return useForm<EditTourFormData>({
    resolver: zodResolver(editTourSchema),
    defaultValues: {
      type: TourType.GROUP,
      localizations: SUPPORTED_LOCALES.map((locale) => ({
        locale,
        name: "",
        startLocation: "",
        locations: [],
        description: "",
      })),
      days: 1,
      nights: 0,
      mainImage: null,
      gallery: [],
      isPublic: false,
      isDaily: false,
      startDate: new Date().toISOString().split("T")[0],
      groupPricing: {
        totalPrice: 0,
        reservationPrice: 0,
        discountedPrice: 0,
      },
      individualPricing: {
        seasonTotalPrice: 0,
        seasonReservationPrice: 0,
        seasonDiscountedPrice: 0,
        offSeasonTotalPrice: 0,
        offSeasonReservationPrice: 0,
        offSeasonDiscountedPrice: 0,
      },
      maxPersons: 1,
    },
    mode: "onChange",
  });
};
