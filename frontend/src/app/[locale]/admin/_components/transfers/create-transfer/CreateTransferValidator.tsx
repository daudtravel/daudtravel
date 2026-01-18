import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { VehicleType } from "@/src/types/transfers.types";

const TransferLocalizationSchema = z.object({
  locale: z.string().min(1, "Locale is required"),
  startLocation: z.string().min(1, "Start location is required"),
  endLocation: z.string().min(1, "End location is required"),
});

const VehicleTypeSchema = z.object({
  type: z.nativeEnum(VehicleType),
  price: z.number().min(0.01, "Price must be greater than 0"),
  maxPersons: z.number().int().min(1, "Max persons must be at least 1"),
});

const CreateTransferSchema = z.object({
  localizations: z.array(TransferLocalizationSchema).optional(),
  vehicleTypes: z
    .array(VehicleTypeSchema)
    .min(1, "At least one vehicle type is required"),
  isPublic: z.boolean().optional(),
});

export type CreateTransferFormData = z.infer<typeof CreateTransferSchema>;

export const useCreateTransferValidator = () => {
  return useForm<CreateTransferFormData>({
    resolver: zodResolver(CreateTransferSchema),
    defaultValues: {
      localizations: [
        {
          locale: "ka",
          startLocation: "",
          endLocation: "",
        },
      ],
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
