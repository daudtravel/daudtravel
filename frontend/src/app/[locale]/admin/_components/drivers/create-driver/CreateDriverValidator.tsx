import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const createDriverSchema = z.object({
  firstName: z.string().min(2, "სახელი სავალდებულოა"),
  lastName: z.string().min(2, "გვარი სავალდებულოა"),
  photo: z.string().optional(),
  photoFile: z.instanceof(File).optional(),
});

export type CreateDriverFormData = z.infer<typeof createDriverSchema>;

export const useCreateDriverValidator = () => {
  return useForm<CreateDriverFormData>({
    resolver: zodResolver(createDriverSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      photo: undefined,
      photoFile: undefined,
    },
    mode: "onChange",
  });
};
