import { cn } from "@/src/utlis/cn";

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "green",
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "green" | "yellow" | "red" | "blue" | "neutral";
  className?: string;
}) {
  const toneClasses = {
    green: "bg-brand-green-50 text-brand-green",
    yellow: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-sky-50 text-sky-600",
    neutral: "bg-gray-100 text-gray-600",
  }[tone];

  return (
    <div
      data-print-card
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm print:break-inside-avoid",
        className
      )}
    >
      {Icon && (
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl print:hidden",
            toneClasses
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="mt-1 truncate text-xl font-bold text-gray-900 tabular-nums">
          {value}
        </p>
        {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
      </div>
    </div>
  );
}
