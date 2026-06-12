import { z } from "zod";

export enum TourType {
  GROUP = "GROUP",
  INDIVIDUAL = "INDIVIDUAL",
}

export const SUPPORTED_LOCALES = ["en", "ka", "ru", "ar", "tr"] as const;

const localizationSchema = z.object({
  locale: z.string().default("ka"),
  name: z.string().optional().default(""),
  description: z.string().optional().default(""),
  startLocation: z.string().optional().default(""),
  locations: z.array(z.string()).default([]),
});

// A translation only counts if everything the backend requires is filled
export const isCompleteLocalization = (loc: {
  name?: string;
  description?: string;
  startLocation?: string;
}): boolean =>
  !!(loc.name?.trim() && loc.description?.trim() && loc.startLocation?.trim());

const groupPricingSchema = z.object({
  totalPrice: z.coerce.number().min(0, "Total price must be positive"),
  reservationPrice: z.coerce
    .number()
    .min(0, "Reservation price must be positive"),
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

// Custom validator for image - accepts both base64 string and empty string (File will be added at submit)
const imageValidator = z.union([
  z.string().regex(/^data:image\//, "Invalid image format"),
  z.string().length(0), // Allow empty string when File object is stored separately
]);

export const createTourSchema = z
  .object({
    type: z.nativeEnum(TourType).default(TourType.GROUP),

    localizations: z
      .array(localizationSchema)
      .refine((locs) => locs.some(isCompleteLocalization), {
        message:
          "მინიმუმ ერთი სრული თარგმანი აუცილებელია (დასახელება, აღწერა, საწყისი ლოკაცია)",
      }),

    days: z.coerce.number().min(1, "Days must be at least 1").default(1),
    nights: z.coerce.number().min(0, "Nights must be positive").default(0),

    // Changed: Accept empty string during form filling, will validate File object at submit
    mainImage: z.string().default(""),

    // Changed: Accept array of empty strings during form filling
    gallery: z.array(z.string()).default([]),

    isPublic: z.boolean().default(false),
    isDaily: z.boolean().default(false),

    groupPricing: groupPricingSchema.optional(),
    individualPricing: individualPricingSchema.optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    maxPersons: z.coerce.number().min(1).optional(),
  })
  .refine((data) => data.type !== TourType.GROUP || !!data.groupPricing, {
    message: "Group pricing is required for group tours",
    path: ["groupPricing"],
  })
  .refine(
    (data) =>
      data.type !== TourType.INDIVIDUAL ||
      (!!data.individualPricing && !!data.maxPersons),
    {
      message:
        "Individual pricing and max persons are required for individual tours",
      path: ["individualPricing"],
    }
  );

export type CreateTourFormData = z.infer<typeof createTourSchema>;

export interface ApiResponse<T, M = undefined> {
  message: string;
  data: T;
  meta?: M;
}

export interface TourLocalization {
  id: string;
  tourId: string;
  locale: string;
  name: string;
  description: string;
  startLocation: string;
  locations: string[];
}

export interface TourImage {
  id: string;
  tourId: string;
  url: string;
  order: number;
  createdAt: string;
}

export interface GroupPricing {
  id: string;
  tourId: string;
  totalPrice: number;
  reservationPrice: number;
  discountedPrice?: number;
}

export interface IndividualPricing {
  id: string;
  tourId: string;
  seasonTotalPrice: number;
  seasonReservationPrice: number;
  seasonDiscountedPrice: number;
  offSeasonTotalPrice: number;
  offSeasonReservationPrice: number;
  offSeasonDiscountedPrice: number;
}

export interface Tour {
  id: string;
  type: TourType;
  days: number;
  nights: number;
  maxPersons?: number;
  startDate?: string;
  isPublic: boolean;
  isDaily: boolean;
  mainImage: string;
  createdAt: string;
  updatedAt: string;
  localizations: TourLocalization[];
  images: TourImage[];
  groupPricing?: GroupPricing;
  individualPricing?: IndividualPricing;
}

export interface CreateTourResponse extends ApiResponse<Tour> {}

export interface GetToursResponse
  extends ApiResponse<
    Tour[],
    {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  > {}
