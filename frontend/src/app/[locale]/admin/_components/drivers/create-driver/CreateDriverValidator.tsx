import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { z } from "zod";

// Translator for the "admin" namespace (validation messages are localized)
type Translate = (key: string) => string;

export const createDriverSchema = (t: Translate) =>
  z.object({
    firstName: z.string().min(2, t("drivers.validation.firstNameRequired")),
    lastName: z.string().min(2, t("drivers.validation.lastNameRequired")),
    photo: z.string().optional(),
    photoFile: z.instanceof(File).optional(),
  });

export type CreateDriverFormData = z.infer<
  ReturnType<typeof createDriverSchema>
>;

export const useCreateDriverValidator = () => {
  const t = useTranslations("admin");
  const schema = useMemo(() => createDriverSchema(t), [t]);

  return useForm<CreateDriverFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      photo: undefined,
      photoFile: undefined,
    },
    mode: "onChange",
  });
};
