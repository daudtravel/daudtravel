import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const SUPPORTED_LOCALES = ["ka", "en", "ru", "tr", "ar"] as const;

export const createFaqSchema = z.object({
  localizations: z.array(
    z.object({
      locale: z.string(),
      question: z.string(),
      answer: z.string(),
    })
  ),
  category: z.string().optional(),
});

export const editFaqSchema = z.object({
  localizations: z.array(
    z.object({
      locale: z.string(),
      question: z.string().optional().or(z.literal("")),
      answer: z.string().optional().or(z.literal("")),
    })
  ),
  category: z.string().optional(),
});

export type CreateFaqFormData = z.infer<typeof createFaqSchema>;
export type EditFaqFormData = z.infer<typeof editFaqSchema>;

export const useCreateFaqValidator = () => {
  return useForm<CreateFaqFormData>({
    resolver: zodResolver(createFaqSchema),
    defaultValues: {
      localizations: SUPPORTED_LOCALES.map((locale) => ({
        locale,
        question: "",
        answer: "",
      })),
      category: "",
    },
  });
};

export const useEditFaqValidator = () => {
  return useForm<EditFaqFormData>({
    resolver: zodResolver(editFaqSchema),
    defaultValues: {
      localizations: SUPPORTED_LOCALES.map((locale) => ({
        locale,
        question: "",
        answer: "",
      })),
      category: "",
    },
  });
};
