import { MapPin, ArrowRight } from "lucide-react";

interface RouteTagProps {
  from: string;
  to: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "light" | "green";
}

const SIZE = {
  sm: { text: "text-sm", icon: "h-3.5 w-3.5", arrow: "h-3 w-3" },
  md: { text: "text-base", icon: "h-4 w-4", arrow: "h-4 w-4" },
  lg: { text: "text-lg font-bold", icon: "h-5 w-5", arrow: "h-5 w-5" },
};

export function RouteTag({ from, to, size = "md", variant = "default" }: RouteTagProps) {
  const s = SIZE[size];
  const colorFrom = variant === "green" ? "text-brand-yellow" : "text-brand-green";
  const colorTo = variant === "green" ? "text-brand-cream" : "text-gray-700";
  const arrowColor = variant === "green" ? "text-brand-yellow/60" : "text-gray-400";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1">
        <MapPin className={`${s.icon} ${colorFrom} shrink-0`} />
        <span className={`${s.text} ${colorFrom} font-semibold`}>{from}</span>
      </div>
      <ArrowRight className={`${s.arrow} ${arrowColor} shrink-0`} />
      <div className="flex items-center gap-1">
        <MapPin className={`${s.icon} ${colorTo} shrink-0`} />
        <span className={`${s.text} ${colorTo} font-semibold`}>{to}</span>
      </div>
    </div>
  );
}
