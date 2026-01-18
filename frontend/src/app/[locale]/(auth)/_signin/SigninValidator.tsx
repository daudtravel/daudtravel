"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function SigninValidator() {
  const formSchema = z.object({
    email: z.string().min(6, { message: "email is required" }),
    password: z.string().min(6, { message: "password is required" }),
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
