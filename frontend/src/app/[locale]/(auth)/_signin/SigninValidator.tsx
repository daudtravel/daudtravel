"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

export function SigninValidator() {
  const t = useTranslations("auth.validation");
  const formSchema = z.object({
    email: z.string().email({ message: t("invalidEmail") }).min(1, { message: t("emailRequired") }),
    password: z.string().min(6, { message: t("passwordRequired") }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return form;
}
