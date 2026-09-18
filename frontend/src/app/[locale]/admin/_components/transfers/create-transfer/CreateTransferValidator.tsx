import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { VehicleType } from "@/src/types/transfers.types";

export const SUPPORTED_LOCALES = ["en", "ka", "ru", "ar", "tr"] as const;

// Translator for the "admin" namespace (validation messages are localized)
type Translate = (key: string) => string;

const TransferLocalizationSchema = (t: Translate) =>
  z.object({
    locale: z.string().min(1, t("transfers.validation.localeRequired")),
    startLocation: z.string().optional().default(""),
    endLocation: z.string().optional().default(""),
  });

const VehicleTypeSchema = (t: Translate) =>
  z.object({
    type: z.nativeEnum(VehicleType),
    price: z.number().min(0.01, t("transfers.validation.pricePositive")),
    maxPersons: z
      .number()
      .int()
      .min(1, t("transfers.validation.maxPersonsMin")),
  });

const CreateTransferSchema = (t: Translate) =>
  z.object({
    localizations: z
      .array(TransferLocalizationSchema(t))
      .refine(
        (locs) =>
          locs.some((l) => l.startLocation?.trim() && l.endLocation?.trim()),
        { message: t("transfers.validation.minOneLanguage") }
      ),
    vehicleTypes: z
      .array(VehicleTypeSchema(t))
      .min(1, t("transfers.validation.vehicleTypeRequired")),
    isPublic: z.boolean().optional(),
  });

export type CreateTransferFormData = z.infer<
  ReturnType<typeof CreateTransferSchema>
>;

export const useCreateTransferValidator = () => {
  const t = useTranslations("admin");
  const schema = useMemo(() => CreateTransferSchema(t), [t]);

  return useForm<CreateTransferFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      localizations: SUPPORTED_LOCALES.map((locale) => ({
        locale,
        startLocation: "",
        endLocation: "",
      })),
      vehicleTypes: [
        {
          type: VehicleType.SEDAN,
          price: 0,
          maxPersons: 4,
        },
        {
          type: VehicleType.MINIVAN,
          price: 0,
          maxPersons: 6,
        },
        {
          type: VehicleType.VITO,
          price: 0,
          maxPersons: 8,
        },
        {
          type: VehicleType.SPRINTER,
          price: 0,
          maxPersons: 16,
        },
        {
          type: VehicleType.BUS,
          price: 0,
          maxPersons: 16,
        },
      ],
      isPublic: false,
    },
    mode: "onChange",
  });
};
