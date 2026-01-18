"use client";
import { Separator } from "@/src/components/ui/separator";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import img from "@img/images/Batumi.jpg";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import UserInfoForm from "./components/UserInfoForm";
import CodeVerifyForm from "./components/CodeVerifyForm";
import { useSignupStore } from "@/src/zustand/useSignupStore";
import { UserValidator } from "./validators/UserValidator";

export default function SignupModalWrapper() {
  const form = UserValidator();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get("signup");
  const { setUserInfo } = useSignupStore();
  const [open, setIsOpen] = useState(false);
  const [isVerificationStep, setIsVerificationStep] = useState(false);

  const authClickHandler = (name: string) => {
    router.replace(`${pathname}?${name}`);
    setIsOpen(false);
  };

  const modalCloseClickHandler = () => {
    if (status !== null) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("signup");
      router.replace(`${pathname}?${newSearchParams.toString()}`, {
        scroll: false,
      });
      setIsOpen(false);
      setIsVerificationStep(false);
      form.reset();
      setUserInfo({
        firstName: undefined,
        lastName: undefined,
        email: undefined,
        password: undefined,
        confirmPassword: undefined,
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      modalCloseClickHandler();
    }
    setIsOpen(open);
  };

  useEffect(() => {
    if (status !== null) {
      setIsOpen(true);
    }
  }, [status]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-screen md:h-[600px] max-w-4xl p-0 border-none md:rounded-md overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Sign Up</DialogTitle>
        </DialogHeader>

        <div className="relative hidden w-1/2 md:block">
          <Image
            src={img}
            alt="Sign up background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-8 left-8 right-8">
            <h2 className="text-3xl font-bold text-white">
              {isVerificationStep
                ? "Verify Your Account"
                : "Join Our Community"}
            </h2>
            <p className="mt-2 text-white/80">
              {isVerificationStep
                ? "Enter the code sent to your email"
                : "Discover amazing features and connect with others"}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col justify-between bg-white p-8 md:w-1/2">
          <div>
            {!isVerificationStep ? (
              <>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Create an account
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Sign up to get started with all our features
                </p>
                <Separator className="my-5" />
                <UserInfoForm setIsVerificationStep={setIsVerificationStep} />
              </>
            ) : (
              <CodeVerifyForm
                setIsVerificationStep={setIsVerificationStep}
                setIsOpen={setIsOpen}
              />
            )}
          </div>

          {!isVerificationStep && (
            <p className="mt-4 text-center text-sm text-gray-500">
              Already have an account?
              <button
                onClick={() => authClickHandler("signin")}
                className="font-medium text-gray-900 hover:underline ml-1"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
