import { Button } from "@/src/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { useSignupStore } from "@/src/zustand/useSignupStore";
import React, { Dispatch, SetStateAction, useState } from "react";
import { UserValidator } from "../validators/UserValidator";
import { axiosInstance } from "@/src/utlis/axiosInstance";
import { Mail } from "lucide-react";
import { AxiosError } from "axios";

type UserInfoFormProps = {
  setIsVerificationStep: Dispatch<SetStateAction<boolean>>;
};

export default function UserInfoForm({
  setIsVerificationStep,
}: UserInfoFormProps) {
  const form = UserValidator();
  const { setUserInfo } = useSignupStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    try {
      setIsSubmitting(true);

      const userData = {
        email: form.getValues("email"),
      };
      setUserInfo({
        firstName: form.getValues("firstName"),
        lastName: form.getValues("lastName"),
        email: form.getValues("email"),
        password: form.getValues("password"),
        confirmPassword: form.getValues("confirmPassword"),
      });

      const response = await axiosInstance.post("/send_code", userData);

      if (response.data.message === "CODE_SEND") {
        setIsVerificationStep(true);
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        if (error.response.data.message === "EMAIL_EXIST") {
          form.setError("email", {
            type: "manual",
            message: "Email already exists",
          });
        } else if (
          error.response.data.message === "VERIFICATION_CODE_ALREADY_SENT"
        ) {
          setIsVerificationStep(true);
        }
      } else {
        console.error("An unexpected error occurred:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="First Name" {...field} className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Last Name" {...field} className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Enter your email"
                  {...field}
                  className="h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Create a password"
                  {...field}
                  className="h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  {...field}
                  className="h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="h-11 w-full text-white mt-4"
          disabled={isSubmitting}
        >
          <Mail className="mr-2 h-4 w-4" />
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </Form>
  );
}
