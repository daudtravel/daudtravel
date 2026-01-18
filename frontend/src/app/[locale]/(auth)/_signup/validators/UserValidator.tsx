import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSignupStore } from "@/src/zustand/useSignupStore";

export function UserValidator() {
  const { userInfo } = useSignupStore();

  const formSchema = z
    .object({
      firstName: z
        .string()
        .min(2, { message: "First name must be at least 2 characters" })
        .max(50, { message: "First name must not exceed 50 characters" }),
      lastName: z
        .string()
        .min(2, { message: "Last name must be at least 2 characters" })
        .max(50, { message: "Last name must not exceed 50 characters" }),
      email: z
        .string()
        .min(1, { message: "Email is required" })
        .email({ message: "Invalid email address" }),
      password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters" })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
          message: "Password must include uppercase, lowercase, and number",
        }),
      confirmPassword: z
        .string()
        .min(1, { message: "Confirm password is required" }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: userInfo?.firstName || "",
      lastName: userInfo?.lastName || "",
      email: userInfo?.email || "",
      password: userInfo?.password || "",
      confirmPassword: userInfo?.confirmPassword || "",
    },
  });

  return form;
}
