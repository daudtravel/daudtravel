import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/src/utlis/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors print:border-gray-400 print:bg-transparent print:text-black [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "border-gray-200 bg-gray-50 text-gray-600",
        green: "border-brand-green-100 bg-brand-green-50 text-brand-green",
        yellow: "border-amber-200 bg-amber-50 text-amber-700",
        red: "border-red-200 bg-red-50 text-red-600",
        blue: "border-sky-200 bg-sky-50 text-sky-700",
        purple: "border-violet-200 bg-violet-50 text-violet-700",
        dark: "border-brand-green-dark bg-brand-green-dark text-brand-cream",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge, badgeVariants };
