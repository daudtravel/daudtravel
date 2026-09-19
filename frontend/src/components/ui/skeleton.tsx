import { cn } from "@/src/utlis/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200/70", className)}
      {...props}
    />
  );
}

export { Skeleton };
