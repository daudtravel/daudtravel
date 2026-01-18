import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { VehicleType } from "@/src/types/transfers.types";

const TransferLocalizationSchema = z
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
      message: "Both locations are required",
      path: ["startLocation"],
    }
  );

const VehicleTypeSchema = z.object({
  type: z.nativeEnum(VehicleType),
  price: z.number().min(0.01),
  maxPersons: z.number().int().min(1),
});

const UpdateTransferSchema = z.object({
  localizations: z.array(TransferLocalizationSchema).optional(),
  vehicleTypes: z.array(VehicleTypeSchema).optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateTransferFormData = z.infer<typeof UpdateTransferSchema>;

export const useEditTransferValidator = () =>
  useForm<UpdateTransferFormData>({
    resolver: zodResolver(UpdateTransferSchema),
    defaultValues: {
      localizations: undefined, // 🔥 IMPORTANT
      vehicleTypes: undefined,
      isPublic: false,
    },
    mode: "onChange",
  });
