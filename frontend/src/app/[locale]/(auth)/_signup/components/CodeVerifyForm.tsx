import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { axiosInstance } from "@/src/utlis/axiosInstance";
import { AxiosError } from "axios";
import { Check } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { UserValidator } from "../validators/UserValidator";
import { CodeValidator } from "../validators/CodeValidator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/src/components/ui/form";
import { useRouter } from "next/navigation";
import { useSignupStore } from "@/src/zustand/useSignupStore";

type CodeVerifyFormProps = {
  setIsVerificationStep: Dispatch<SetStateAction<boolean>>;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export default function CodeVerifyForm({
  setIsVerificationStep,
  setIsOpen,
}: CodeVerifyFormProps) {
  const userInfoForm = UserValidator();
  const codeForm = CodeValidator();
  const router = useRouter();
  const { setUserInfo } = useSignupStore();

  const onVerify = async () => {
    try {
      await axiosInstance.post("/signup", {
        firstName: userInfoForm.getValues("firstName"),
        lastName: userInfoForm.getValues("lastName"),
        password: userInfoForm.getValues("password"),
        email: userInfoForm.getValues("email"),
        code: codeForm.getValues("code"),
      });

      userInfoForm.reset();
      setUserInfo({
        firstName: undefined,
        lastName: undefined,
        email: undefined,
        password: undefined,
        confirmPassword: undefined,
      });
      setIsVerificationStep(false);
      router.push("/?signin");
      setIsOpen(false);
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        if (error.response.data.message === "INVALID_VERIFICATION_CODE") {
          codeForm.setError("code", {
            type: "manual",
            message: "Incorrect verification code",
          });
        }
        if (error.response.data.message === "VERIFICATION_CODE_EXPIRED") {
          codeForm.setError("code", {
            type: "manual",
            message: "Verification code expired, get new one",
          });
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={() => setIsVerificationStep(false)}>back</button>
      <h3 className="text-2xl font-semibold text-gray-900">
        Verify Your Email
      </h3>
      <p className="mt-2 text-sm text-gray-500">
        Check your email for a 6-digit verification code
      </p>
      <Separator className="my-5" />
      <Form {...codeForm}>
        <form onSubmit={codeForm.handleSubmit(onVerify)} className="space-y-4">
          <FormField
            control={codeForm.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Enter 6-digit verification code"
                    {...field}
                    className="h-11"
                    maxLength={6}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="h-11 w-full text-white mt-4">
            <Check className="mr-2 h-4 w-4" />
            Verify Code
          </Button>
        </form>
      </Form>
    </div>
  );
}
