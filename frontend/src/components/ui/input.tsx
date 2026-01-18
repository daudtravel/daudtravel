import * as React from "react";
import { cn } from "@/src/utlis/cn";

// Extend InputProps to accept custom props hasError and isSuccess
export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
  isSuccess?: boolean;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, isSuccess, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:border focus:border-main disabled:cursor-not-allowed disabled:opacity-50",
          isSuccess ? "border-green-500 " : "focus:border-main",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
