import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { VehicleType } from "@/src/types/transfers.types";

// Translator for the "admin" namespace (validation messages are localized)
type Translate = (key: string) => string;

const TransferLocalizationSchema = (t: Translate) =>
  z
    .object({
      locale: z.string(),
      startLocation: z.string().optional(),
      endLocation: z.string().optional(),
    })
    .refine(
      (v) =>
        !v.startLocation && !v.endLocation
          ? true
          : !!v.startLocation && !!v.endLocation,
      {
        message: t("transfers.validation.bothLocationsRequired"),
        path: ["startLocation"],
      }
    );

const VehicleTypeSchema = (t: Translate) =>
  z.object({
    type: z.nativeEnum(VehicleType),
    price: z.number().min(0.01, t("transfers.validation.pricePositive")),
    maxPersons: z
      .number()
      .int()
      .min(1, t("transfers.validation.maxPersonsMin")),
  });

const UpdateTransferSchema = (t: Translate) =>
  z.object({
    localizations: z.array(TransferLocalizationSchema(t)).optional(),
    vehicleTypes: z.array(VehicleTypeSchema(t)).optional(),
    isPublic: z.boolean().optional(),
  });

export type UpdateTransferFormData = z.infer<
  ReturnType<typeof UpdateTransferSchema>
>;

export const useEditTransferValidator = () => {
  const t = useTranslations("admin");
  const schema = useMemo(() => UpdateTransferSchema(t), [t]);

  return useForm<UpdateTransferFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      localizations: undefined, // 🔥 IMPORTANT
      vehicleTypes: undefined,
      isPublic: false,
    },
    mode: "onChange",
  });
};
